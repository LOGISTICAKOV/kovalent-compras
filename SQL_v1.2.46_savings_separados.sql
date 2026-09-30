-- v1.2.46 — Saving de Cotação + Saving de Desconto
-- Saving de Cotação = 2ª melhor proposta válida - proposta vencedora.
-- Saving de Desconto é calculado no frontend = proposta vencedora - valor efetivamente comprado.
-- Não cria colunas: os novos valores ficam no JSONB itens para manter compatibilidade.

CREATE OR REPLACE FUNCTION public.concluir_comparativo_item(
    p_pedido_id uuid,
    p_item_index integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_modalidade text;
    v_justificativa text;
    v_qtd_cotacoes integer;
    v_qtd_selecionadas integer;
    v_fornecedor text;
    v_preco_unitario numeric;
    v_quantidade numeric;
    v_frete numeric;
    v_justificativa_escolha text;
    v_valor_vencedor numeric;
    v_valor_referencia numeric := 0;
    v_saving_cotacao numeric := 0;
    v_total_com_frete numeric;
    v_itens jsonb;
    v_item jsonb;
    v_qtd_pedido numeric;
BEGIN
    IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado.'; END IF;
    IF NOT public.usuario_ativo() THEN RAISE EXCEPTION 'Usuário inativo.'; END IF;
    IF public.perfil_atual() NOT IN ('ADMIN','COMPRADOR') THEN
        RAISE EXCEPTION 'Apenas ADMIN ou COMPRADOR pode concluir o comparativo.';
    END IF;
    IF p_item_index < 0 THEN RAISE EXCEPTION 'Índice do item inválido.'; END IF;

    SELECT itens INTO v_itens FROM public.pedidos WHERE id=p_pedido_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado.'; END IF;
    IF jsonb_typeof(v_itens) <> 'array' OR p_item_index >= jsonb_array_length(v_itens) THEN
        RAISE EXCEPTION 'Item não encontrado no pedido.';
    END IF;
    v_item := v_itens -> p_item_index;

    SELECT modalidade, justificativa INTO v_modalidade, v_justificativa
    FROM public.decisoes_cotacao_itens
    WHERE pedido_id=p_pedido_id AND item_index=p_item_index;
    IF NOT FOUND THEN RAISE EXCEPTION 'Defina a modalidade da cotação antes de concluir.'; END IF;

    IF v_modalidade='DISPENSA' THEN
        IF NULLIF(TRIM(COALESCE(v_justificativa,'')),'') IS NULL THEN
            RAISE EXCEPTION 'Informe a justificativa para a dispensa de comparação.';
        END IF;
        v_item := jsonb_set(v_item,'{modalidadeCotacao}',to_jsonb('DISPENSA'::text),true);
        v_item := jsonb_set(v_item,'{obsNegociacao}',to_jsonb(v_justificativa),true);
        v_item := jsonb_set(v_item,'{valorReferenciaCotacaoItem}',to_jsonb(0::numeric),true);
        v_item := jsonb_set(v_item,'{savingCotacaoItem}',to_jsonb(0::numeric),true);
        v_itens := jsonb_set(v_itens,ARRAY[p_item_index::text],v_item,false);
        UPDATE public.pedidos SET itens=v_itens,updated_at=now() WHERE id=p_pedido_id;
        RETURN true;
    END IF;

    SELECT COUNT(*),COUNT(*) FILTER(WHERE selecionado=true)
      INTO v_qtd_cotacoes,v_qtd_selecionadas
    FROM public.cotacoes_itens WHERE pedido_id=p_pedido_id AND item_index=p_item_index;

    IF v_modalidade='COMPARACAO' THEN
        IF v_qtd_cotacoes < 2 THEN RAISE EXCEPTION 'Comparação realizada exige pelo menos duas cotações.'; END IF;
        IF v_qtd_selecionadas <> 1 THEN RAISE EXCEPTION 'Selecione exatamente uma cotação vencedora.'; END IF;
    ELSIF v_modalidade='FORNECEDOR_UNICO' THEN
        IF v_qtd_cotacoes <> 1 THEN RAISE EXCEPTION 'Fornecedor único exige exatamente uma cotação.'; END IF;
        UPDATE public.cotacoes_itens SET selecionado=true,updated_at=now()
        WHERE pedido_id=p_pedido_id AND item_index=p_item_index;
    ELSE
        RAISE EXCEPTION 'Modalidade de cotação inválida.';
    END IF;

    SELECT fornecedor,preco_unitario,quantidade,COALESCE(frete,0),justificativa_escolha
      INTO v_fornecedor,v_preco_unitario,v_quantidade,v_frete,v_justificativa_escolha
    FROM public.cotacoes_itens
    WHERE pedido_id=p_pedido_id AND item_index=p_item_index AND selecionado=true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Nenhuma cotação vencedora encontrada.'; END IF;

    BEGIN
        v_qtd_pedido := NULLIF(REPLACE(COALESCE(v_item->>'qtd',''),',','.'),'')::numeric;
    EXCEPTION WHEN invalid_text_representation THEN v_qtd_pedido := NULL;
    END;
    IF v_qtd_pedido IS NULL OR v_qtd_pedido<=0 THEN v_qtd_pedido:=v_quantidade; END IF;

    -- Valor da proposta vencedora para a quantidade efetivamente solicitada.
    v_valor_vencedor := ROUND(v_preco_unitario*v_qtd_pedido,2);
    v_total_com_frete := ROUND(v_valor_vencedor+v_frete,2);

    -- Na comparação, a referência é a SEGUNDA MENOR proposta válida.
    -- O frete continua registrado separadamente; o saving por item compara o valor dos produtos.
    IF v_modalidade='COMPARACAO' THEN
        SELECT ROUND(x.preco_unitario*v_qtd_pedido,2)
          INTO v_valor_referencia
        FROM public.cotacoes_itens x
        WHERE x.pedido_id=p_pedido_id AND x.item_index=p_item_index
        ORDER BY (x.preco_unitario*v_qtd_pedido) ASC, x.created_at ASC
        OFFSET 1 LIMIT 1;
        v_valor_referencia := COALESCE(v_valor_referencia,0);
        v_saving_cotacao := ROUND(v_valor_referencia-v_valor_vencedor,2);
    ELSE
        v_valor_referencia := 0;
        v_saving_cotacao := 0;
    END IF;

    -- A proposta vencedora permanece como valorCotadoItem para compatibilidade com versões anteriores.
    v_item := jsonb_set(v_item,'{fornecedorCotado}',to_jsonb(v_fornecedor),true);
    v_item := jsonb_set(v_item,'{precoUnitarioCotado}',to_jsonb(v_preco_unitario),true);
    v_item := jsonb_set(v_item,'{freteCotacaoItem}',to_jsonb(v_frete),true);
    v_item := jsonb_set(v_item,'{valorCotadoItem}',to_jsonb(v_valor_vencedor),true);
    v_item := jsonb_set(v_item,'{valorPropostaVencedoraItem}',to_jsonb(v_valor_vencedor),true);
    v_item := jsonb_set(v_item,'{valorReferenciaCotacaoItem}',to_jsonb(v_valor_referencia),true);
    v_item := jsonb_set(v_item,'{savingCotacaoItem}',to_jsonb(v_saving_cotacao),true);
    v_item := jsonb_set(v_item,'{valorTotalCotacaoComFreteItem}',to_jsonb(v_total_com_frete),true);
    v_item := jsonb_set(v_item,'{modalidadeCotacao}',to_jsonb(v_modalidade),true);
    IF NULLIF(TRIM(COALESCE(v_justificativa_escolha,'')),'') IS NOT NULL THEN
        v_item := jsonb_set(v_item,'{obsNegociacao}',to_jsonb(v_justificativa_escolha),true);
    END IF;

    v_itens := jsonb_set(v_itens,ARRAY[p_item_index::text],v_item,false);
    UPDATE public.pedidos SET itens=v_itens,updated_at=now() WHERE id=p_pedido_id;
    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.concluir_comparativo_item(uuid,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.concluir_comparativo_item(uuid,integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.concluir_comparativo_item(uuid,integer) TO authenticated;
