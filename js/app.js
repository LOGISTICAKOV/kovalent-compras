// =========================================================
// SUPABASE — pure fetch (no client library)
// =========================================================
const SUPA_URL = "https://wyjtvvmdukcbhcawqopm.supabase.co";
const SUPA_KEY = "sb_publishable_H46yclEwduXtZfTFdmRy9Q_H2c8yhJL";
const SUPA_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPA_KEY,
  'Authorization': 'Bearer ' + SUPA_KEY,
  'Prefer': 'return=minimal'
};

// =========================================================
// v1.2.14 — RESPONSÁVEL PELA FINALIZAÇÃO
// Mantém separado de "recebidoPor" (quem recebeu fisicamente o material).
// O nome é persistido dentro de obs com um marcador técnico, evitando
// necessidade de nova coluna no Supabase.
// =========================================================
function getFinalizadoPor(p) {
  if (!p) return '';
  if (p.finalizadoPor) return String(p.finalizadoPor).trim();
  const m = String(p.obs || '').match(/\[FINALIZADO_POR:([^\]]+)\]/i);
  return m ? String(m[1]).trim() : '';
}

function setFinalizadoPor(p, nome) {
  if (!p) return;
  nome = String(nome || '').trim();
  let obs = String(p.obs || '')
    .replace(/\s*\|?\s*\[FINALIZADO_POR:[^\]]*\]/ig, '')
    .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
    .trim();
  p.finalizadoPor = nome;
  p.obs = nome ? (obs ? obs + ' | ' : '') + '[FINALIZADO_POR:' + nome + ']' : obs;
}

function clearFinalizadoPor(p) {
  if (!p) return;
  p.finalizadoPor = '';
  p.obs = String(p.obs || '')
    .replace(/\s*\|?\s*\[FINALIZADO_POR:[^\]]*\]/ig, '')
    .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
    .trim();
}

function getObsPublica(p) {
  if (!p) return '';
  return String(p.obs || '')
    .replace(/\s*\|?\s*\[FINALIZADO_POR:[^\]]*\]/ig, '')
    .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
    .trim();
}

// Map camelCase fields to snake_case DB columns
function toDB(p) {
  return {
    sc: p.sc, origem: p.origem||null, empresa: p.empresa||null,
    data: p.data||null, solicitante: p.solicitante||null,
    departamento: p.departamento||null, prioridade: p.prioridade||null,
    necessidade: p.necessidade||null, tipo: p.tipo||null,
    itens: p.itens||[], fornecedor_sug: p.fornecedorSug||null,
    fornecedor_esc: p.fornecedorEsc||null,
    valor_ref: p.valorRef||null, valor_cotacao: p.valorCotacao||null,
    valor_pago: p.valorPago||null, valor_saving: p.saving||null,
    valor_saving_ref: p.savingRef||null, link_produto: p.linkProduto||null,
    justificativa: p.justificativa||null, aprovador: p.aprovador||null,
    obs: p.obs||null, status: p.status||'Solicitado',
    doc_pc: p.docPC||null, doc_fatura: p.docFatura||null, doc_nfe: p.docNFE||null,
    rastreio: p.rastreio||null, previsao_entrega: p.previsaoEntrega||null,
    periodicidade: p.periodicidade||null, proxima_compra: p.proximaCompra||null,
    motivo_reposicao: p.motivoReposicao||null,
    data_cotacao: p.dataCotacao||null, data_pedido_compra: p.dataPedidoCompra||null,
    data_aguardando: p.dataAguardando||null, data_acaminho: p.dataACaminho||null,
    data_lancar_nf: p.dataLancarNF||null, data_recebimento: p.dataRecebimento||null,
    data_conferencia: p.dataConferencia||null, data_aguardando_id: p.dataAguardandoId||null,
    data_amostragem: p.dataAmostragem||null, data_aguardando_ret: p.dataAguardandoRet||null,
    data_finalizado: p.dataFinalizado||null, data_cancelado: p.dataCancelado||null,
    recebido_por: p.recebidoPor||null,
  };
}

function fromDB(r) {
  return {
    sc: r.sc, origem: r.origem, empresa: r.empresa,
    data: r.data, solicitante: r.solicitante,
    departamento: r.departamento, prioridade: r.prioridade,
    necessidade: r.necessidade, tipo: r.tipo,
    itens: r.itens||[], fornecedorSug: r.fornecedor_sug,
    fornecedorEsc: r.fornecedor_esc,
    valorRef: r.valor_ref, valorCotacao: r.valor_cotacao,
    valorPago: r.valor_pago, saving: r.valor_saving,
    savingRef: r.valor_saving_ref, linkProduto: r.link_produto,
    justificativa: r.justificativa, aprovador: r.aprovador,
    obs: r.obs, status: r.status,
    docPC: r.doc_pc, docFatura: r.doc_fatura, docNFE: r.doc_nfe,
    rastreio: r.rastreio, previsaoEntrega: r.previsao_entrega,
    periodicidade: r.periodicidade, proximaCompra: r.proxima_compra,
    motivoReposicao: r.motivo_reposicao,
    dataCotacao: r.data_cotacao, dataPedidoCompra: r.data_pedido_compra,
    dataAguardando: r.data_aguardando, dataACaminho: r.data_acaminho,
    dataLancarNF: r.data_lancar_nf, dataRecebimento: r.data_recebimento,
    dataConferencia: r.data_conferencia, dataAguardandoId: r.data_aguardando_id,
    dataAmostragem: r.data_amostragem, dataAguardandoRet: r.data_aguardando_ret,
    dataFinalizado: r.data_finalizado, dataCancelado: r.data_cancelado,
    recebidoPor: r.recebido_por,
  };
}

async function dbLoad() {
  try {
    const res = await fetch(SUPA_URL + '/rest/v1/pedidos?select=*&order=created_at.desc', {
      headers: SUPA_HEADERS
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('HTTP ' + res.status + ': ' + txt);
    }
    const data = await res.json();
    pedidos = (data||[]).map(fromDB);
    updateExcelBadge(pedidos.length);
    return true;
  } catch(e) {
    console.error('Supabase load error:', e.message);
    const el = document.getElementById('excelStatus');
    if (el) {
      el.className = 'excel-badge disconnected';
      el.innerHTML = '<div class="dot"></div><span>Erro: ' + e.message + '</span>';
    }
    return false;
  }
}

async function dbInsert(p) {
  try {
    const res = await fetch(SUPA_URL + '/rest/v1/pedidos', {
      method: 'POST',
      headers: { ...SUPA_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify(toDB(p))
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('dbInsert error:', txt);
      toast('Erro ao salvar: ' + txt, 'error');
    }
  } catch(e) { console.error('dbInsert exception:', e); toast('Erro conexão ao salvar', 'error'); }
}

async function dbUpdate(p) {
  try {
    const sc = encodeURIComponent(p.sc);
    const res = await fetch(SUPA_URL + '/rest/v1/pedidos?sc=eq.' + sc, {
      method: 'PATCH',
      headers: { ...SUPA_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify(toDB(p))
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error('dbUpdate error:', txt);
      toast('Erro ao atualizar: ' + txt, 'error');
    }
  } catch(e) { console.error('dbUpdate exception:', e); toast('Erro conexão ao atualizar', 'error'); }
}

function updateExcelBadge(count) {
  const el = document.getElementById('excelStatus');
  if (!el) return;
  el.className = 'excel-badge';
  el.innerHTML = '<div class="dot"></div><span>' + count + ' pedidos — Supabase ✓</span>';
}

async function dbDelete(sc) {
  try {
    const scEnc = encodeURIComponent(sc);
    const res = await fetch(SUPA_URL + '/rest/v1/pedidos?sc=eq.' + scEnc, {
      method: 'DELETE',
      headers: {
        ...SUPA_HEADERS,
        'Prefer': 'return=representation'
      }
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('dbDelete HTTP error:', res.status, txt);
      toast('Erro ao excluir no banco: ' + res.status, 'error');
      return false;
    }

    const deletedRows = await res.json();

    if (!deletedRows || deletedRows.length === 0) {
      console.warn('Nenhuma linha foi excluída no Supabase para SC:', sc);
      toast('Pedido removido da tela, mas não foi excluído do banco. Verifique a permissão DELETE no Supabase.', 'error');
      await dbLoad();
      renderPedidosTable();
      return false;
    }

    console.log('dbDelete success for SC:', sc, deletedRows);
    return true;

  } catch(e) {
    console.error('dbDelete exception:', e.message);
    toast('Erro de conexão ao excluir — pedido não foi removido do banco', 'error');
    return false;
  }
}

// =========================================================
// ALMOX HISTORICO MENSAL
// =========================================================
window._almoxMesOffset = 0; // 0 = mês atual, -1 = mês passado, etc.

function openAtrasadosAlmoxModal() {
  const hoje = new Date();
  const statusDateMap = {
    'Lançar NF':                      'dataLancarNF',
    'Conferência':                    'dataConferencia',
    'Aguardando Identificação':       'dataAguardandoId',
    'Amostragem':                     'dataAmostragem',
    'Aguardando Retirada do Estoque': 'dataAguardandoRet',
  };
  const ALMOS = Object.keys(statusDateMap);
  const PRAZO = 2;

  const atrasados = pedidos.filter(p => {
    if (!ALMOS.includes(p.status)) return false;
    const dateField = statusDateMap[p.status];
    const entrada = p[dateField] ? new Date(p[dateField]) : (p.dataLancarNF ? new Date(p.dataLancarNF) : null);
    if (!entrada) return false;
    return (hoje - entrada) / 86400000 > PRAZO;
  }).sort((a, b) => {
    const da = new Date(a[statusDateMap[a.status]] || a.dataLancarNF || 0);
    const db = new Date(b[statusDateMap[b.status]] || b.dataLancarNF || 0);
    return da - db; // mais antigos primeiro
  });

  const CORES = {
    'Lançar NF':'#fb923c','Conferência':'#0ea5e9',
    'Aguardando Identificação':'#a855f7','Amostragem':'#ec4899',
    'Aguardando Retirada do Estoque':'#f59e0b'
  };

  const rows = atrasados.map(p => {
    const dateField = statusDateMap[p.status];
    const entrada = p[dateField] ? new Date(p[dateField]) : (p.dataLancarNF ? new Date(p.dataLancarNF) : null);
    const dias = entrada ? Math.floor((hoje - entrada) / 86400000) : '?';
    const cor = dias > 5 ? '#dc2626' : '#d97706';
    return '<tr class="clickable" onclick="closeModal();setTimeout(()=>openModal(\'' + p.sc + '\'),100)">'
      + '<td><strong style="color:var(--accent2)">' + p.sc + '</strong></td>'
      + '<td>' + (p.empresa||'—') + '</td>'
      + '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.itens&&p.itens[0]?p.itens[0].descricao:'—') + '</td>'
      + '<td>' + (p.departamento||'—') + '</td>'
      + '<td><span class="status-badge status-' + statusKey(p.status) + '">' + p.status + '</span></td>'
      + '<td style="color:' + cor + ';font-weight:700">' + dias + 'd nesta etapa</td>'
      + '</tr>';
  }).join('');

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">'
    + '<div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:#dc2626">🔴 Pedidos Atrasados — Almoxarifado</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">' + atrasados.length + ' pedido' + (atrasados.length!==1?'s':'') + ' com mais de ' + PRAZO + ' dias sem atualização</div></div>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<table style="width:100%;font-size:13px;border-collapse:collapse">'
    + '<thead><tr><th>SC</th><th>Empresa</th><th>Item</th><th>Depto.</th><th>Status Atual</th><th>Tempo na Etapa</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table>'
    + '<div style="margin-top:16px;text-align:right"><button class="btn btn-secondary" onclick="closeModal()">Fechar</button></div>';

  document.getElementById('modal-overlay').classList.add('open');
}

function navMesAlmox(delta) {
  window._almoxMesOffset += delta;
  // não vai para o futuro
  if (window._almoxMesOffset > 0) window._almoxMesOffset = 0;
  renderAlmoxHist();
}

function renderAlmoxHist() {
  const hoje = new Date();
  const offset = window._almoxMesOffset || 0;
  const refDate = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
  const mes = refDate.getMonth();
  const ano = refDate.getFullYear();

  // label
  const label = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const el = document.getElementById('almox-mes-label');
  if (el) el.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  const sumField = (arr, field) =>
    arr.reduce((s,p) => s + (p.itens||[]).reduce((si,i) => si + (parseFloat(i[field])||0), 0), 0);

  const inMes = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === mes && d.getFullYear() === ano;
  };

  // filter by month
  const amostMes    = pedidos.filter(p => inMes(p.dataAmostragem) && (p.itens||[]).some(i => i.amoCaixas > 0 || i.amoItens > 0));
  const volumeMes   = pedidos.filter(p => inMes(p.dataLancarNF)   && (p.itens||[]).some(i => i.volume > 0));

  const cxMes   = sumField(amostMes,  'amoCaixas');
  const itMes   = sumField(amostMes,  'amoItens');
  const volMes  = sumField(volumeMes, 'volume');

  const histEl = document.getElementById('kpi-almox-hist');
  if (histEl) {
    const isCurrentMonth = offset === 0;
    const subLabel = isCurrentMonth ? 'mês atual' : 'neste mês';
    histEl.innerHTML =
      '<div class="kpi-card" style="border-color:rgba(236,72,153,0.2)">'
      + '<div class="kpi-label">🧪 Volumes Amostrados</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#ec4899">' + cxMes + '</div>'
      + '<div class="kpi-sub">' + subLabel + '</div></div>'

      + '<div class="kpi-card" style="border-color:rgba(236,72,153,0.2)">'
      + '<div class="kpi-label">🧪 Unidades Amostradas</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#ec4899">' + itMes + '</div>'
      + '<div class="kpi-sub">' + subLabel + '</div></div>'

      + '<div class="kpi-card" style="border-color:rgba(251,146,60,0.2)">'
      + '<div class="kpi-label">📦 Volumes Recebidos</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#fb923c">' + volMes + '</div>'
      + '<div class="kpi-sub">' + subLabel + '</div></div>';
  }

  // Médias mensais (baseadas em todos os meses que têm dados)
  // Build month buckets
  const buckets = {};
  pedidos.forEach(p => {
    // amostragem
    if (p.dataAmostragem && (p.itens||[]).some(i => i.amoCaixas > 0 || i.amoItens > 0)) {
      const d = new Date(p.dataAmostragem);
      const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      if (!buckets[k]) buckets[k] = { cx:0, it:0, vol:0 };
      buckets[k].cx += (p.itens||[]).reduce((s,i) => s+(parseFloat(i.amoCaixas)||0),0);
      buckets[k].it += (p.itens||[]).reduce((s,i) => s+(parseFloat(i.amoItens) ||0),0);
    }
    // volumes
    if (p.dataLancarNF && (p.itens||[]).some(i => i.volume > 0)) {
      const d = new Date(p.dataLancarNF);
      const k = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
      if (!buckets[k]) buckets[k] = { cx:0, it:0, vol:0 };
      buckets[k].vol += (p.itens||[]).reduce((s,i) => s+(parseFloat(i.volume)||0),0);
    }
  });

  const keys = Object.keys(buckets);
  const nMeses = Math.max(1, keys.length);
  const mediaCx  = keys.length ? (Object.values(buckets).reduce((s,b)=>s+b.cx, 0)  / nMeses).toFixed(1) : '—';
  const mediaIt  = keys.length ? (Object.values(buckets).reduce((s,b)=>s+b.it, 0)  / nMeses).toFixed(1) : '—';
  const mediaVol = keys.length ? (Object.values(buckets).reduce((s,b)=>s+b.vol,0)  / nMeses).toFixed(1) : '—';

  const mediaEl = document.getElementById('kpi-almox-media');
  if (mediaEl) {
    mediaEl.innerHTML =
      '<div class="kpi-card" style="background:rgba(236,72,153,0.04);border-color:rgba(236,72,153,0.15)">'
      + '<div class="kpi-label">🧪 Média — Volumes Amostrados</div>'
      + '<div class="kpi-value" style="font-size:22px;color:#ec4899">' + mediaCx + '</div>'
      + '<div class="kpi-sub">por mês (' + nMeses + ' mês' + (nMeses!==1?'es':'') + ' com dados)</div></div>'

      + '<div class="kpi-card" style="background:rgba(236,72,153,0.04);border-color:rgba(236,72,153,0.15)">'
      + '<div class="kpi-label">🧪 Média — Unidades Amostradas</div>'
      + '<div class="kpi-value" style="font-size:22px;color:#ec4899">' + mediaIt + '</div>'
      + '<div class="kpi-sub">por mês (' + nMeses + ' mês' + (nMeses!==1?'es':'') + ' com dados)</div></div>'

      + '<div class="kpi-card" style="background:rgba(251,146,60,0.04);border-color:rgba(251,146,60,0.15)">'
      + '<div class="kpi-label">📦 Média — Volumes Recebidos</div>'
      + '<div class="kpi-value" style="font-size:22px;color:#fb923c">' + mediaVol + '</div>'
      + '<div class="kpi-sub">por mês (' + nMeses + ' mês' + (nMeses!==1?'es':'') + ' com dados)</div></div>';
  }
}

// Real-time: poll every 15 seconds for changes
let _lastPollCount = 0;
function initRealtime() {
  setInterval(async () => {
    try {
      const res = await fetch(SUPA_URL + '/rest/v1/pedidos?select=count', {
        headers: { ...SUPA_HEADERS, 'Prefer': 'count=exact' }
      });
      const count = parseInt(res.headers.get('content-range')?.split('/')[1] || '0');
      if (count !== _lastPollCount) {
        _lastPollCount = count;
        await dbLoad();
        const active = document.querySelector('.tab-pane.active');
        if (active) {
          const tab = active.id.replace('tab-','');
          if (tab === 'pedidos') renderPedidosTable();
          if (tab === 'painel') {
            renderDashboard();
            if (window._kpiView === 'almox') renderKPIAlmox();
          }
          if (tab === 'programadas') renderProgramadasTable();
        }
      }
    } catch(e) { /* silently ignore poll errors */ }
  }, 15000);
}

// =========================================================
// DATA LAYER
// =========================================================
const COLUMNS = [
  { col:'A', name:'SC',            ex:'SC-2024-001',      req:true  },
  { col:'B', name:'Data Solicitação', ex:'01/10/2024',    req:true  },
  { col:'C', name:'Solicitante',   ex:'João Silva',       req:true  },
  { col:'D', name:'Departamento',  ex:'Produção',         req:false },
  { col:'E', name:'Centro de Custo', ex:'CC-001',         req:false },
  { col:'F', name:'Prioridade',    ex:'Alta',             req:true  },
  { col:'G', name:'Data Necessidade', ex:'15/10/2024',    req:true  },
  { col:'H', name:'Tipo de Compra', ex:'Reagente',        req:false },
  { col:'I', name:'Descrição dos Itens', ex:'Ácido X 1L', req:true  },
  { col:'J', name:'Fornecedor Sugerido', ex:'FornecedorXYZ', req:false },
  { col:'K', name:'Valor Estimado (R$)', ex:'1500,00',    req:false },
  { col:'L', name:'Justificativa', ex:'Reposição estoque', req:true },
  { col:'M', name:'Aprovador',     ex:'Maria Gestora',    req:false },
  { col:'N', name:'Status',        ex:'Recebido',         req:true  },
  { col:'O', name:'Fornecedor Escolhido', ex:'FornXYZ',   req:false },
  { col:'P', name:'Nº Pedido/NF',  ex:'NF-001234',       req:false },
  { col:'Q', name:'Data Pedido Emitido', ex:'05/10/2024', req:false },
  { col:'R', name:'Data Previsão Entrega', ex:'20/10/2024', req:false },
  { col:'S', name:'Data Recebimento', ex:'19/10/2024',    req:false },
  { col:'T', name:'Recebido Por',  ex:'Carlos Almox',     req:false },
  { col:'U', name:'Observações',   ex:'Conferido OK',     req:false },
];

let pedidos = [];
let itemCount = 0;
let scCounter = parseInt(localStorage.getItem('kv_sc') || '1');

// =========================================================
// INIT
// =========================================================
document.addEventListener('DOMContentLoaded', async () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-data').value = today;
  generateSC();
  addItemRow();
  renderColModel();
  // Load from Supabase
  await dbLoad();
  renderDashboard();
  initRealtime();
});

function generateSC() {
  const y = new Date().getFullYear();
  document.getElementById('f-sc').value = `SC-${y}-${String(scCounter).padStart(3,'0')}`;
}

// =========================================================
// TABS
// =========================================================
function switchTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const navBtn = document.getElementById('nav-' + name);
  if (navBtn) navBtn.classList.add('active');
  if (name === 'painel') renderDashboard();
  if (name === 'pedidos') renderPedidosTable();
  if (name === 'programadas') renderProgramadasTable();
}

// =========================================================
// FORM ITEMS
// =========================================================
function addItemRow() {
  itemCount++;
  const id = itemCount;
  const row = document.createElement('div');
  row.className = 'item-row';
  row.id = `item-${id}`;
  row.innerHTML = `
    <input type="text" placeholder="Descrição do item ${id}">
    <select>
      <option>Un</option><option>Kg</option><option>L</option>
      <option>mL</option><option>g</option><option>mg</option>
      <option>Cx</option><option>Pç</option><option>Pc</option>
    </select>
    <input type="number" placeholder="0" min="0" step="0.01">
    <input type="text" placeholder="Código / Ref.">
    <button class="btn-icon" onclick="removeItem(${id})" title="Remover">✕</button>
  `;
  document.getElementById('items-body').appendChild(row);
}

function removeItem(id) {
  const el = document.getElementById(`item-${id}`);
  if (el) el.remove();
}

// =========================================================
// SUBMIT
// =========================================================
function submitSolicitacao() {
  const sc = document.getElementById('f-sc').value;
  const empresa = document.getElementById('f-empresa').value;
  const solicitante = document.getElementById('f-solicitante').value.trim();
  const depto = document.getElementById('f-depto').value;
  const prioridade = document.getElementById('f-prioridade').value;
  const necessidade = document.getElementById('f-necessidade').value;
  const justificativa = document.getElementById('f-justificativa').value.trim();

  // collect items
  const rows = document.querySelectorAll('#items-body .item-row');
  const items = [];
  rows.forEach(r => {
    const inputs = r.querySelectorAll('input, select');
    const desc = inputs[0].value.trim();
    if (desc) {
      items.push({
        descricao: desc,
        unidade: inputs[1].value,
        qtd: inputs[2].value || '1',
        ref: inputs[3].value
      });
    }
  });

  if (!empresa || !solicitante || !depto || !prioridade || !necessidade || !justificativa) {
    toast('Preencha todos os campos obrigatórios (*)', 'error'); return;
  }
  if (items.length === 0) {
    toast('Adicione pelo menos um item à solicitação', 'error'); return;
  }

  const novoPedido = {
    sc,
    empresa,
    data: document.getElementById('f-data').value,
    solicitante,
    departamento: depto,
    prioridade,
    necessidade,
    tipo: document.getElementById('f-tipo').value,
    itens: items,
    fornecedorSug: document.getElementById('f-fornecedor').value,
    linkProduto: document.getElementById('f-link').value,
    valorRef: parseFloat(document.getElementById('f-valref').value)||0,
    justificativa,
    aprovador: document.getElementById('f-aprovador').value,
    obs: document.getElementById('f-obs').value,
    status: 'Solicitado',
    dataCriacao: new Date().toISOString(),
  };

  pedidos.unshift(novoPedido);
  scCounter++;
  localStorage.setItem('kv_sc', scCounter);
  dbInsert(novoPedido);

  toast(`✔ Solicitação ${sc} registrada com sucesso!`, 'success');
  clearForm();
  generateSC();
  addItemRow();

  // show in tracker
  setTimeout(() => {
    document.querySelectorAll('.nav-btn')[1].click();
    document.getElementById('searchInput').value = sc;
    searchOrders();
  }, 800);
}

function clearForm() {
  ['f-solicitante','f-fornecedor','f-link','f-valref','f-justificativa','f-obs','f-aprovador'].forEach(id => {
    document.getElementById(id).value = '';
  });
  ['f-empresa','f-depto','f-prioridade','f-tipo'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-necessidade').value = '';
  document.getElementById('items-body').innerHTML = '';
  itemCount = 0;
  addItemRow();
}

// =========================================================
// SEARCH / TRACKER
// =========================================================
function searchOrders() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const container = document.getElementById('search-results');

  if (!q) { container.innerHTML = ''; return; }

  const results = pedidos.filter(p =>
    p.sc.toLowerCase().includes(q) ||
    p.solicitante.toLowerCase().includes(q) ||
    p.itens.some(i => i.descricao.toLowerCase().includes(q)) ||
    (p.fornecedorSug||'').toLowerCase().includes(q)
  );

  if (results.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><h3>Nenhum pedido encontrado</h3><p>Tente outro termo de busca</p></div>`;
    return;
  }

  container.innerHTML = results.map(p => `
    <div class="order-card" onclick="openModal('${p.sc}')">
      <div class="order-card-header">
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="order-id">${p.sc}</div>
            ${p.origem==='reposicao'?'<span style="background:rgba(0,169,157,0.12);color:#00a99d;border:1px solid rgba(0,169,157,0.3);border-radius:100px;font-size:10px;padding:2px 8px;font-weight:600">REPOSICAO</span>':''}
            ${p.origem==='programada'?'<span style="background:rgba(124,58,237,0.12);color:#7c3aed;border:1px solid rgba(124,58,237,0.3);border-radius:100px;font-size:10px;padding:2px 8px;font-weight:600">PROGRAMADA</span>':''}
          </div>
          <div style="font-size:12px; color:var(--muted); margin-top:3px">${p.solicitante||'Comprador'} · ${p.departamento}</div>
        </div>
        <span class="status-badge status-${statusKey(p.status)}">${p.status}</span>
      </div>
        <div class="order-meta">
        ${p.empresa ? `<div class="order-meta-item"><strong>Empresa:</strong> ${p.empresa}</div>` : ''}
        <div class="order-meta-item"><strong>Prioridade:</strong><span class="priority-${p.prioridade.toLowerCase()}">${p.prioridade}</span></div>
        <div class="order-meta-item"><strong>Necessidade:</strong> ${formatDate(p.necessidade)}</div>
        <div class="order-meta-item"><strong>Tipo:</strong> ${p.tipo||'—'}</div>
        <div class="order-meta-item"><strong>Itens:</strong> ${p.itens.length}</div>
      </div>
    </div>
  `).join('');
}

// =========================================================
// MODAL DETALHE
// =========================================================
function openModal(sc) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;

  const steps = [
    { label:'Solicitado',                      icon:'📋', status:'done',                                                        date: formatDate(p.data),      note: `Por ${p.solicitante}` },
    { label:'Cotação',                         icon:'💬', status: stepStatus(p.status, 'Cotação'),                              date: p.dataCotacao||'',        note: p.valorCotacao ? `R$ ${Number(p.valorCotacao).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '' },
    { label:'Pedido de Compra',                icon:'📝', status: stepStatus(p.status, 'Pedido de Compra'),                     date: p.dataPedidoCompra||'',   note: p.docPC ? `PC: ${p.docPC}` : '' },
    { label:'Aguardando Pagamento',            icon:'💳', status: stepStatus(p.status, 'Aguardando Pagamento'),                 date: p.dataAguardando||'',     note: p.docFatura ? `Fat.: ${p.docFatura}` : '' },
    { label:'A Caminho',                       icon:'🚚', status: stepStatus(p.status, 'A Caminho'),                            date: p.dataACaminho||'',       note: p.rastreio ? `Rastreio: ${p.rastreio}` : '' },
    { label:'Lançar NF',                       icon:'🧾', status: stepStatus(p.status, 'Lançar NF'),                            date: p.dataLancarNF||'',       note: p.docNFE ? `NF: ${p.docNFE}` : '' },
    { label:'Conferência',                     icon:'🔍', status: stepStatus(p.status, 'Conferência'),                          date: p.dataConferencia ? formatDate(p.dataConferencia) : '',    note: '' },
    { label:'Aguardando Identificação',        icon:'🏷️', status: stepStatus(p.status, 'Aguardando Identificação'),             date: p.dataAguardandoId ? formatDate(p.dataAguardandoId) : '',   note: '' },
    { label:'Amostragem',                      icon:'🧪', status: stepStatus(p.status, 'Amostragem'),                           date: p.dataAmostragem ? formatDate(p.dataAmostragem) : '',     note: '' },
    { label:'Aguardando Retirada do Estoque',  icon:'📤', status: stepStatus(p.status, 'Aguardando Retirada do Estoque'),       date: p.dataAguardandoRet ? formatDate(p.dataAguardandoRet) : '',  note: '' },
    { label:'Finalizado',                      icon:'✅', status: stepStatus(p.status, 'Finalizado'),                           date: p.dataFinalizado||'',     note: (p.dataFinalizado && getFinalizadoPor(p)) ? `Por: ${getFinalizadoPor(p)}` : '' },
  ];

  const tlHtml = steps.map((s,i) => `
    <div class="tl-step">
      <div class="tl-icon-col">
        <div class="tl-dot ${s.status}">${s.icon}</div>
        ${i < steps.length-1 ? '<div class="tl-line"></div>' : ''}
      </div>
      <div class="tl-content">
        <div class="tl-label">${s.label}</div>
        ${s.date ? `<div class="tl-date">${s.date}</div>` : ''}
        ${s.note ? `<div class="tl-note">${s.note}</div>` : ''}
      </div>
    </div>
  `).join('');

  const showVolume   = ['Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado'].includes(p.status);
  const showAmostra  = p.status === 'Amostragem';

  const mkNumInput = (id, val, onblurFn, w) =>
    `<input type="number" id="${id}" value="${val}" min="0" placeholder="0"
       style="width:${w||'70px'};background:var(--surface);border:1.5px solid var(--border);
              border-radius:6px;padding:5px 8px;font-size:13px;text-align:center;outline:none;
              color:var(--text);font-family:'DM Sans',sans-serif"
       onfocus="this.style.borderColor='var(--accent2)'"
       onblur="${onblurFn}">`;

  const itensHtml = p.itens.map((item, idx) => {
    const volCell = showVolume
      ? `<td style="padding:6px 8px">${mkNumInput('vol-'+idx, item.volume||'', "saveVolume('"+p.sc+"',"+idx+",this.value)", '70px')}</td>`
      : '';
    const amoCxCell = showAmostra
      ? `<td style="padding:6px 8px">${mkNumInput('amocx-'+idx, item.amoCaixas||'', "saveAmostra('"+p.sc+"',"+idx+",'amoCaixas',this.value)", '70px')}</td>`
      : '';
    const amoQtCell = showAmostra
      ? `<td style="padding:6px 8px">${mkNumInput('amoqt-'+idx, item.amoItens||'', "saveAmostra('"+p.sc+"',"+idx+",'amoItens',this.value)", '70px')}</td>`
      : '';
    return `<tr>
      <td style="padding:8px">${item.descricao}</td>
      <td style="padding:8px">${item.qtd}</td>
      <td style="padding:8px">${item.unidade}</td>
      <td style="padding:8px">${item.ref||'—'}</td>
      ${volCell}${amoCxCell}${amoQtCell}
    </tr>`;
  }).join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div>
        <div style="font-family:'Inter',sans-serif; font-size:22px; font-weight:700">${p.sc}</div>
        <div style="color:var(--muted); font-size:13px; margin-top:4px">${p.solicitante} · ${p.departamento}</div>
      </div>
      <div style="display:flex; align-items:center; gap:12px">
        <span class="status-badge status-${statusKey(p.status)}">${p.status}</span>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px">
      <div style="background:var(--surface2); border-radius:10px; padding:14px">
        <div style="font-size:11px; color:var(--muted); margin-bottom:4px">PRIORIDADE</div>
        <div class="priority-${p.prioridade.toLowerCase()}" style="font-weight:600">${p.prioridade}</div>
      </div>
      <div style="background:var(--surface2); border-radius:10px; padding:14px">
        <div style="font-size:11px; color:var(--muted); margin-bottom:4px">NECESSIDADE</div>
        <div>${formatDate(p.necessidade)}</div>
      </div>
      <div style="background:var(--surface2); border-radius:10px; padding:14px">
        <div style="font-size:11px; color:var(--muted); margin-bottom:4px">TIPO</div>
        <div>${p.tipo||'—'}</div>
      </div>
    </div>
    ${p.linkProduto ? `<div style="margin-bottom:16px; background:var(--surface2); border-radius:10px; padding:14px; display:flex; align-items:center; gap:10px"><div style="font-size:11px; color:var(--muted); margin-right:4px">🔗 LINK:</div><a href="${p.linkProduto}" target="_blank" style="color:var(--accent); font-size:13px; word-break:break-all">${p.linkProduto}</a></div>` : ''}

    <div class="card-title"><span>📦</span> Itens</div>
    <table style="width:100%; font-size:13px; margin-bottom:20px">
      <thead><tr style="border-bottom:1px solid var(--border)">
        <th style="padding:8px; text-align:left; color:var(--muted)">Descrição</th>
        <th style="padding:8px; text-align:left; color:var(--muted)">Qtd</th>
        <th style="padding:8px; text-align:left; color:var(--muted)">Un.</th>
        <th style="padding:8px; text-align:left; color:var(--muted)">Ref.</th>
        ${showVolume ? '<th style="padding:8px; text-align:left; color:#fb923c; font-weight:700">📦 Volume (cx)</th>' : ''}
        ${showAmostra ? '<th style="padding:8px; text-align:left; color:#ec4899; font-weight:700">🧪 Cx. Amostradas</th>' : ''}
        ${showAmostra ? '<th style="padding:8px; text-align:left; color:#ec4899; font-weight:700">🧪 Unidades Amostradas</th>' : ''}
      </tr></thead>
      <tbody>${itensHtml}</tbody>
    </table>

    <div class="card-title"><span>🗺</span> Acompanhamento</div>
    <div class="timeline">${tlHtml}</div>

    ${p.justificativa ? `<div style="margin-top:20px; background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:6px">JUSTIFICATIVA</div><div style="font-size:13px">${p.justificativa}</div></div>` : ''}
    ${getObsPublica(p) ? `<div style="margin-top:12px; background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:6px">OBSERVAÇÕES</div><div style="font-size:13px">${getObsPublica(p)}</div></div>` : ''}

    ${(p.valorCotacao || p.valorPago || p.valorRef) ? '<div style="margin-top:16px;background:rgba(0,169,157,0.06);border:1px solid rgba(0,169,157,0.2);border-radius:12px;padding:16px"><div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">💰 Resumo Financeiro</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">' + (p.valorRef?'<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Referência</div><div style="font-size:15px;font-weight:600;color:#60a5fa">R$ '+Number(p.valorRef).toLocaleString("pt-BR",{minimumFractionDigits:2})+'</div></div>':'')+(p.valorCotacao?'<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">1ª Cotação</div><div style="font-size:15px;font-weight:600;color:#f59e0b">R$ '+Number(p.valorCotacao).toLocaleString("pt-BR",{minimumFractionDigits:2})+'</div></div>':'')+(p.valorPago?'<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Valor Pago</div><div style="font-size:15px;font-weight:600;color:#34d399">R$ '+Number(p.valorPago).toLocaleString("pt-BR",{minimumFractionDigits:2})+'</div></div>':'')+(p.saving?'<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">Saving</div><div style="font-size:15px;font-weight:700;color:#34d399">R$ '+Number(p.saving).toLocaleString("pt-BR",{minimumFractionDigits:2})+(p.valorCotacao?'<div style="font-size:11px;font-weight:400">'+( p.saving/p.valorCotacao*100).toFixed(1)+'%</div>':'')+'</div></div>':'')+'</div></div>' : ''}
  `;
  const p2 = pedidos.find(x => x.sc === sc);
  const canAlmox = window.almoxarifeMode && p2 && ALMOX_STATUSES.includes(p2.status);
  const canEdit  = window.compradorMode || canAlmox;
  document.getElementById('modal-content').innerHTML +=
    '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">'
    + (canEdit
        ? '<button class="btn btn-secondary" onclick="updateStatus(\'' + sc + '\')">🔄 Atualizar Status</button>'
        : window.almoxarifeMode
          ? '<span style="font-size:12px;color:#a855f7;display:flex;align-items:center;gap:6px">📦 Almoxarife só pode atualizar a partir de Lançar NF</span>'
          : '<span style="font-size:12px;color:#6b7f96;display:flex;align-items:center;gap:6px">🔒 Apenas compradores podem atualizar o status</span>')
        + (window.compradorMode ? '<button class="btn btn-secondary" onclick="openEditModal(\'' + sc + '\')">Editar</button>' : '')
    + (window.compradorMode ? '<button class="btn btn-danger" onclick="confirmarExclusao(\'' + sc + '\')">Excluir</button>' : '')
    + '<button class="btn btn-secondary" onclick="closeModal()">Fechar</button>'
    + '</div>';
  document.getElementById('modal-overlay').classList.add('open');
}

function updateStatus(sc) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;

  const statusList = ['Solicitado','Cotação','Pedido de Compra','Aguardando Pagamento','A Caminho','Recebimento Parcial','Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado','Cancelado'];
  const statusIcons = {
    'Solicitado':'📋','Cotação':'💬','Pedido de Compra':'📝',
    'Aguardando Pagamento':'💳','A Caminho':'🚚','Lançar NF':'🧾',
    'Conferência':'🔍','Aguardando Identificação':'🏷️','Amostragem':'🧪',
    'Aguardando Retirada do Estoque':'📤','Finalizado':'✅','Cancelado':'❌'
  };

  // store sc globally so selectStatusOption can access it safely
  window._currentUpdateSC = sc;

  const visibleStatuses = (window.almoxarifeMode && !window.compradorMode)
    ? statusList.filter(st => ALMOX_STATUSES.includes(st))
    : statusList;

  const optionsHtml = visibleStatuses.map(st => {
    const isCurrent = st === p.status;
    return '<button type="button" onclick="selectStatusOption(this,\'' + st.replace(/'/g,"\\'") + '\')" '
      + 'class="status-option-btn ' + (isCurrent ? 'current' : '') + '" data-status="' + st + '">'
      + '<span>' + (statusIcons[st]||'•') + '</span>'
      + '<span>' + st + '</span>'
      + (isCurrent ? '<span style="font-size:10px;opacity:.7;margin-left:auto">atual</span>' : '')
      + '</button>';
  }).join('');

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">'
    + '<div>'
    + '<div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700">Atualizar Status</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">' + p.sc + ' · ' + p.solicitante + '</div>'
    + '</div>'
    + '<button class="modal-close" onclick="openModal(\'' + sc + '\')">✕</button>'
    + '</div>'
    + '<div style="margin-bottom:18px">'
    + '<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">Selecione o novo status</div>'
    + '<div id="status-options" style="display:flex;flex-direction:column;gap:6px">' + optionsHtml + '</div>'
    + '</div>'
    + '<div id="status-extra-fields"></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px">'
    + '<button class="btn btn-secondary" onclick="openModal(\'' + sc + '\')">Cancelar</button>'
    + '<button class="btn btn-primary" id="btn-confirm-status" style="display:none" onclick="confirmUpdateStatus()">✔ Confirmar</button>'
    + '</div>';

  document.getElementById('modal-overlay').classList.add('open');
}

function selectStatusOption(el, next) {
  document.querySelectorAll('.status-option-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  window._currentUpdateNext = next;
  document.getElementById('btn-confirm-status').style.display = 'inline-flex';

  const sc = window._currentUpdateSC;
  const p  = pedidos.find(x => x.sc === sc);

  // saving preview
  let savingPreview = '';
  if (p && p.valorCotacao && next === 'Pedido de Compra') {
    savingPreview = '<div style="background:rgba(0,169,157,0.08);border:1px solid rgba(0,169,157,0.2);border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px">'
      + '💡 <strong>1ª Cotação registrada:</strong> R$ ' + Number(p.valorCotacao).toLocaleString('pt-BR',{minimumFractionDigits:2})
      + (p.valorRef ? ' · Referência: R$ ' + Number(p.valorRef).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '')
      + '</div>';
  }
  if (p && p.valorRef && !p.valorCotacao && next === 'Cotação') {
    savingPreview = '<div style="background:rgba(0,58,112,0.06);border:1px solid rgba(0,58,112,0.15);border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px">'
      + '💡 Referência do solicitante: <strong>R$ ' + Number(p.valorRef).toLocaleString('pt-BR',{minimumFractionDigits:2}) + '</strong>'
      + '</div>';
  }

  // extra fields per status
  let extraFields = '';
  if (next === 'Cotação') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">Fornecedor Escolhido</label>'
      + '<input type="text" id="us-fornecedor" placeholder="Nome do fornecedor" style="width:100%">'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">💰 Valor da 1ª Cotação (R$) *</label>'
      + '<input type="number" id="us-cotacao" placeholder="0,00" step="0.01" min="0" style="width:100%">'
      + '</div>';

  } else if (next === 'Pedido de Compra') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">📝 Número do Pedido de Compra *</label>'
      + '<input type="text" id="us-pc" placeholder="Ex: PC-0001" style="width:100%">'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">💰 Valor Negociado / Pago (R$) *</label>'
      + '<input type="number" id="us-valorpago" placeholder="0,00" step="0.01" min="0" style="width:100%">'
      + '</div>';

  } else if (next === 'Conferência') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">📅 Data de Conferência</label>'
      + '<input type="date" id="us-dataconferencia" value="' + new Date().toISOString().split('T')[0] + '" style="width:100%">'
      + '</div>';

  } else if (next === 'Aguardando Identificação') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">🏷️ Data de Identificação do Material</label>'
      + '<input type="date" id="us-dataidentificacao" value="' + new Date().toISOString().split('T')[0] + '" style="width:100%">'
      + '</div>';

  } else if (next === 'Amostragem') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">🧪 Data de Amostragem</label>'
      + '<input type="date" id="us-dataamostragem" value="' + new Date().toISOString().split('T')[0] + '" style="width:100%">'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">'
      + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">📦 Volumes Amostrados *</label><input type="number" id="us-amovol" min="0" step="1" placeholder="0" style="width:100%"></div>'
      + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">🧪 Unidades Amostradas *</label><input type="number" id="us-amoun" min="0" step="1" placeholder="0" style="width:100%"></div>'
      + '</div>';

  } else if (next === 'Aguardando Retirada do Estoque') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">📤 Data de Retirada pelo Cliente Interno *</label>'
      + '<input type="date" id="us-dataretirada" value="' + new Date().toISOString().split('T')[0] + '" style="width:100%">'
      + '</div>';

  } else if (next === 'Aguardando Pagamento') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">Fatura de Adiantamento <span style="font-size:11px;text-transform:none">(opcional)</span></label>'
      + '<input type="text" id="us-fatura" placeholder="Nº da Fatura — deixe em branco se não houver" style="width:100%">'
      + '</div>';

  } else if (next === 'A Caminho') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">Código de Rastreio (opcional)</label>'
      + '<input type="text" id="us-rastreio" placeholder="Ex: BR123456789" style="width:100%">'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">Previsão de Entrega</label>'
      + '<input type="date" id="us-prev" style="width:100%">'
      + '</div>';

  } else if (next === 'Finalizado') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">✅ Nome de quem está finalizando *</label>'
      + '<input type="text" id="us-finalizado-por" placeholder="Nome completo" autocomplete="off" style="width:100%">'
      + '<div style="font-size:11px;color:var(--muted);margin-top:6px">Este nome será exibido somente quando a solicitação for realmente finalizada.</div>'
      + '</div>';

  } else if (next === 'Lançar NF') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">📅 Data de Entrega *</label>'
      + '<input type="date" id="us-datareceb" value="' + new Date().toISOString().split('T')[0] + '" style="width:100%">'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">🧾 Nota Fiscal de Entrada <span style="font-size:11px;text-transform:none">(opcional)</span></label>'
      + '<input type="text" id="us-nfe" placeholder="Nº da NF" style="width:100%">'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">Recebido Por</label>'
      + '<input type="text" id="us-recebido" placeholder="Nome de quem recebeu" style="width:100%">'
      + '</div>';
  }

  document.getElementById('status-extra-fields').innerHTML =
    savingPreview
    + extraFields
    + (extraFields || savingPreview ? '<hr style="border:none;border-top:1px solid var(--border);margin:14px 0">' : '')
    + '<div class="form-group" style="margin-bottom:16px">'
    + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">Observação (opcional)</label>'
    + '<textarea id="us-obs" placeholder="Alguma nota sobre essa etapa..." style="width:100%;min-height:56px"></textarea>'
    + '</div>';
}



// =========================================================
// v1.1.3 — LIMPEZA AUTOMÁTICA AO VOLTAR STATUS
// =========================================================
const STATUS_FLOW_ORDER = ['Solicitado','Cotação','Pedido de Compra','Aguardando Pagamento','A Caminho','Recebimento Parcial','Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado'];

function statusFlowIndex(status) {
  const idx = STATUS_FLOW_ORDER.indexOf(status);
  return idx >= 0 ? idx : 999;
}

function clearRecebimentoItemData(p) {
  if (!p || !Array.isArray(p.itens)) return;
  p.itens.forEach(item => {
    item.recebimentos = [];
    item.qtdRecebida = 0;
    item.quantidadeRecebida = 0;
    item.statusItem = 'Pendente';
    item.volume = '';
    item.amoCaixas = '';
    item.amoItens = '';
  });
}

function clearStageDataAfterStatus(p, nextStatus) {
  if (!p || !nextStatus) return false;
  const currentIdx = statusFlowIndex(p.status);
  const nextIdx = statusFlowIndex(nextStatus);

  // Só limpa campos quando o fluxo está voltando. Avançar status não apaga dados anteriores.
  if (nextIdx >= currentIdx) return false;

  const before = JSON.stringify(p);
  const idx = statusFlowIndex;

  // Ao voltar para antes de uma etapa, limpa os campos que pertencem a essa etapa e às etapas seguintes.
  if (nextIdx < idx('Cotação')) {
    p.fornecedorEsc = '';
    p.valorCotacao = 0;
    p.dataCotacao = '';
  }

  if (nextIdx < idx('Pedido de Compra')) {
    p.docPC = '';
    p.valorPago = 0;
    p.saving = 0;
    p.savingRef = 0;
    p.dataPedidoCompra = '';
  }

  if (nextIdx < idx('Aguardando Pagamento')) {
    p.docFatura = '';
    p.dataAguardando = '';
  }

  if (nextIdx < idx('A Caminho')) {
    p.rastreio = '';
    p.previsaoEntrega = '';
    p.dataACaminho = '';
  }

  // Se voltar para antes de Recebimento Parcial, entende-se que o recebimento/NF lançado estava incorreto.
  // Então apaga NF, data de recebimento e quantidades recebidas dos itens.
  if (nextIdx < idx('Recebimento Parcial')) {
    p.docNFE = '';
    p.dataLancarNF = '';
    p.dataRecebimento = '';
    p.recebidoPor = '';
    clearRecebimentoItemData(p);
  }

  if (nextIdx < idx('Conferência')) {
    p.dataConferencia = '';
  }

  if (nextIdx < idx('Aguardando Identificação')) {
    p.dataAguardandoId = '';
  }

  if (nextIdx < idx('Amostragem')) {
    p.dataAmostragem = '';
    if (Array.isArray(p.itens)) p.itens.forEach(item => { item.amoCaixas = ''; item.amoItens = ''; });
  }

  if (nextIdx < idx('Aguardando Retirada do Estoque')) {
    p.dataAguardandoRet = '';
  }

  if (nextIdx < idx('Finalizado')) {
    p.dataFinalizado = '';
    clearFinalizadoPor(p);
  }

  return before !== JSON.stringify(p);
}

function confirmUpdateStatus() {
  const sc   = window._currentUpdateSC;
  const next = window._currentUpdateNext;
  if (!sc || !next) { toast('Selecione um status', 'error'); return; }
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;
  const today = new Date().toISOString().split('T')[0];
  const rollbackLimpouDados = clearStageDataAfterStatus(p, next);

  // per-step validation & data
  if (next === 'Cotação') {
    const cotVal = parseFloat(document.getElementById('us-cotacao')?.value) || 0;
    if (!cotVal) { toast('Informe o valor da 1ª cotação', 'error'); return; }
    p.valorCotacao = cotVal;
    p.dataCotacao  = today;
    const forn = document.getElementById('us-fornecedor')?.value;
    if (forn) p.fornecedorEsc = forn;

  } else if (next === 'Pedido de Compra') {
    const pc   = document.getElementById('us-pc')?.value?.trim();
    const pago = parseFloat(document.getElementById('us-valorpago')?.value) || 0;
    if (!pc)   { toast('Informe o número do Pedido de Compra', 'error'); return; }
    if (!pago) { toast('Informe o valor negociado/pago', 'error'); return; }
    p.docPC           = pc;
    p.valorPago       = pago;
    p.dataPedidoCompra = today;
    if (p.valorCotacao) p.saving    = p.valorCotacao - pago;
    if (p.valorRef)     p.savingRef = p.valorRef - pago;

  } else if (next === 'Aguardando Pagamento') {
    const fat = document.getElementById('us-fatura')?.value?.trim();
    if (fat) p.docFatura = fat;
    p.dataAguardando = today;

  } else if (next === 'A Caminho') {
    const rastreio = document.getElementById('us-rastreio')?.value;
    const prev     = document.getElementById('us-prev')?.value;
    if (rastreio) p.rastreio        = rastreio;
    if (prev)     p.previsaoEntrega = prev;
    p.dataACaminho = today;

  } else if (next === 'Lançar NF') {
    const nfe = document.getElementById('us-nfe')?.value?.trim();
    if (nfe) p.docNFE = nfe;
    p.dataLancarNF    = today;
    p.dataRecebimento = document.getElementById('us-datareceb')?.value || today;
    const recebPor    = document.getElementById('us-recebido')?.value;
    if (recebPor) p.recebidoPor = recebPor;

  } else if (next === 'Conferência') {
    p.dataConferencia = document.getElementById('us-dataconferencia')?.value || today;

  } else if (next === 'Aguardando Identificação') {
    p.dataAguardandoId = document.getElementById('us-dataidentificacao')?.value || today;

  } else if (next === 'Amostragem') {
    p.dataAmostragem = document.getElementById('us-dataamostragem')?.value || today;
    const amoVol = parseQtd(document.getElementById('us-amovol')?.value);
    const amoUn  = parseQtd(document.getElementById('us-amoun')?.value);
    if (amoVol < 0 || amoUn < 0) { toast('Informe quantidades válidas para a amostragem.', 'error'); return; }
    if (!amoVol && !amoUn) { toast('Informe a quantidade de volumes ou unidades amostradas.', 'error'); return; }
    normalizePedidoItems(p);
    if (!p.itens.length) p.itens = [{}];
    // O KPI soma estes campos nos itens. O primeiro item guarda os totais informados nesta etapa.
    p.itens.forEach((item, idx) => { item.amoCaixas = idx === 0 ? amoVol : 0; item.amoItens = idx === 0 ? amoUn : 0; });

  } else if (next === 'Aguardando Retirada do Estoque') {
    p.dataAguardandoRet = document.getElementById('us-dataretirada')?.value || today;
    if (!p.dataAguardandoRet) { toast('Informe a data de retirada', 'error'); return; }

  } else if (next === 'Finalizado') {
    const finalizadoPor = document.getElementById('us-finalizado-por')?.value?.trim();
    if (!finalizadoPor) { toast('Informe o nome de quem está finalizando a solicitação.', 'error'); return; }
    p.dataFinalizado = today;
    setFinalizadoPor(p, finalizadoPor);

  } else if (next === 'Cancelado') {
    p.dataCancelado = today;
  }

  const obs = document.getElementById('us-obs')?.value;
  if (obs) p.obs = (p.obs ? p.obs + ' | ' : '') + '[' + next + '] ' + obs;

  p.status = next;
  dbUpdate(p);
  toast(rollbackLimpouDados ? '✔ Status atualizado para: ' + next + '. Dados das etapas posteriores foram limpos.' : '✔ Status atualizado para: ' + next, 'success');
  openModal(sc);
  renderPedidosTable();
  renderDashboard();
  try { renderRecebimentosCentral(); } catch(e) {}
}


function closeModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay')) return;
  document.getElementById('modal-overlay').classList.remove('open');
}

function saveDocs(sc) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;
  const pc  = document.getElementById('doc-pc')?.value;
  const fat = document.getElementById('doc-fat')?.value;
  const nfe = document.getElementById('doc-nfe')?.value;
  if (pc  !== undefined) p.docPC     = pc;
  if (fat !== undefined) p.docFatura = fat;
  if (nfe !== undefined) p.docNFE    = nfe;
  dbUpdate(p);
}

// =========================================================
// DASHBOARD / KPI
// =========================================================
function fmtBRL(v) {
  if (!v && v !== 0) return '—';
  return 'R$ ' + Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
}
function fmtPct(v) {
  if (!v && v !== 0) return '—';
  return Number(v).toFixed(1) + '%';
}

function renderDashboard() {
  const total = pedidos.length;
  const hoje = new Date();

  const byStatus = {};
  pedidos.forEach(p => { byStatus[p.status] = (byStatus[p.status]||0)+1; });

  const recebidos = byStatus['Finalizado']||0;
  const emAberto = total - recebidos - (byStatus['Cancelado']||0);
  const atrasados = pedidos.filter(p => p.status !== 'Recebido' && p.status !== 'Cancelado' && p.necessidade && new Date(p.necessidade) < hoje).length;

  // lead time médio
  const leadTimes = pedidos
    .filter(p => p.dataRecebimento && p.data && p.origem !== 'programada')
    .map(p => (new Date(p.dataRecebimento) - new Date(p.data)) / 86400000);
  const avgLead = leadTimes.length ? (leadTimes.reduce((a,b)=>a+b,0)/leadTimes.length).toFixed(1) : '—';

  // tempo médio no status "Lançar NF" (de dataLancarNF até dataConferencia ou hoje se ainda lá)
  const nfTimes = pedidos.filter(p => p.dataLancarNF).map(p => {
    const entrada = new Date(p.dataLancarNF);
    const saida   = p.dataConferencia ? new Date(p.dataConferencia) : new Date();
    return Math.max(0, (saida - entrada) / 86400000);
  });
  const avgNF = nfTimes.length ? (nfTimes.reduce((a,b)=>a+b,0)/nfTimes.length).toFixed(1) : '—';
  const pendentesNF = pedidos.filter(p => p.status === 'Lançar NF').length;

  // Taxa de pedidos entregues no prazo (necessidade >= dataRecebimento)
  const pedidosConcluidos = pedidos.filter(p => p.dataRecebimento && p.necessidade && p.origem !== 'programada');
  const pedidosNoPrazo    = pedidosConcluidos.filter(p => new Date(p.dataRecebimento) <= new Date(p.necessidade));
  const taxaNoPrazo       = pedidosConcluidos.length > 0
    ? Math.round(pedidosNoPrazo.length / pedidosConcluidos.length * 100)
    : null;
  const taxaColor = taxaNoPrazo === null ? 'var(--muted)' : taxaNoPrazo >= 90 ? '#059669' : taxaNoPrazo >= 70 ? '#d97706' : '#dc2626';

  // financeiro
  const totalPago = pedidos.reduce((s,p) => s + (p.valorPago||0), 0);
  const totalCotacao = pedidos.reduce((s,p) => s + (p.valorCotacao||0), 0);
  const totalSaving = pedidos.reduce((s,p) => s + (p.saving||0), 0);
  const savingPct = totalCotacao > 0 ? (totalSaving / totalCotacao * 100) : 0;
  const totalRef = pedidos.reduce((s,p) => s + (p.valorRef||0), 0);
  const savingRef = pedidos.reduce((s,p) => s + (p.savingRef||0), 0);
  const savingRefPct = totalRef > 0 ? (savingRef / totalRef * 100) : 0;

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi-card kv-exec-card kv-exec-saving">
      <div class="kv-exec-icon">💰</div><div><div class="kpi-value">${fmtBRL(totalSaving)}</div><div class="kpi-label">Saving no período</div><div class="kpi-sub">${fmtPct(savingPct)} de economia sobre cotação</div></div>
    </div>
    <div class="kpi-card kv-exec-card kv-exec-orders">
      <div class="kv-exec-icon">🛒</div><div><div class="kpi-value">${total}</div><div class="kpi-label">Pedidos realizados</div><div class="kpi-sub">${emAberto} em aberto</div></div>
    </div>
    <div class="kpi-card kv-exec-card kv-exec-lead">
      <div class="kv-exec-icon">⏱</div><div><div class="kpi-value">${avgLead === '—' ? '—' : avgLead + ' dias'}</div><div class="kpi-label">Lead Time médio</div><div class="kpi-sub">da solicitação à entrega</div></div>
    </div>
    <div class="kpi-card kv-exec-card kv-exec-sla" style="cursor:${taxaNoPrazo!==null?'pointer':'default'}" onclick="${taxaNoPrazo!==null?'openTaxaPrazoModal()':''}">
      <div class="kv-exec-icon">✅</div><div><div class="kpi-value" style="color:${taxaColor}">${taxaNoPrazo !== null ? taxaNoPrazo + '%' : '—'}</div><div class="kpi-label">Taxa de entregas no prazo</div><div class="kpi-sub">${pedidosConcluidos.length} pedidos analisados</div></div>
    </div>
  `;

  const finGrid = document.getElementById('kpi-fin-grid');
  if (finGrid) {
    finGrid.innerHTML = `
      <div class="kpi-card kv-mini-card"><div class="kv-mini-icon">💳</div><div><div class="kpi-label">Total Comprado</div><div class="kpi-value">${fmtBRL(totalPago)}</div><div class="kpi-sub">soma dos valores pagos</div></div></div>
      <div class="kpi-card kv-mini-card"><div class="kv-mini-icon">📌</div><div><div class="kpi-label">Em Aberto</div><div class="kpi-value">${emAberto}</div><div class="kpi-sub">pedidos em andamento</div></div></div>
      <div class="kpi-card kv-mini-card kv-mini-danger"><div class="kv-mini-icon">⚠️</div><div><div class="kpi-label">Atrasados</div><div class="kpi-value">${atrasados}</div><div class="kpi-sub">acima da data necessidade</div></div></div>
      <div class="kpi-card kv-mini-card kv-mini-warn" onclick="openNFDetalhe()" title="Clique para ver pedidos pendentes"><div class="kv-mini-icon">🧾</div><div><div class="kpi-label">Tempo Médio — Lançar NF</div><div class="kpi-value">${avgNF === '—' ? '—' : avgNF + ' dias'}</div><div class="kpi-sub">${pendentesNF} pendente${pendentesNF===1?'':'s'}</div></div></div>
      <div class="kpi-card kv-mini-card"><div class="kv-mini-icon">🎯</div><div><div class="kpi-label">Saving Ref. → Pago</div><div class="kpi-value">${savingRef > 0 ? fmtBRL(savingRef) : '—'}</div><div class="kpi-sub">${savingRef > 0 ? fmtPct(savingRefPct)+' sobre referência' : 'Aguardando dados'}</div></div></div>
    `;
  }

  const statusColors = { 'Solicitado':'#6b7d99', 'Cotação':'#f59e0b', 'Pedido de Compra':'#4ade80', 'Aguardando Pagamento':'#c084fc', 'A Caminho':'#60a5fa', 'Recebimento Parcial':'#d97706', 'Lançar NF':'#fb923c', 'Conferência':'#0ea5e9', 'Aguardando Identificação':'#a855f7', 'Amostragem':'#ec4899', 'Aguardando Retirada do Estoque':'#f59e0b', 'Finalizado':'#34d399', 'Cancelado':'#f87171' };
  document.getElementById('status-bars').innerHTML = Object.entries(statusColors).map(([st,col]) => {
    const count = byStatus[st]||0;
    const pct = total ? Math.round(count/total*100) : 0;
    return `<div class="bar-row"><span style="font-size:13px">${st}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div><span class="bar-count">${count}</span></div>`;
  }).join('');

  const priorities = ['Urgente','Não Urgente','Alta','Média','Baixa'];
  const priColors = {'Urgente':'#ec4899','Não Urgente':'#159b78','Alta':'#ef4444','Média':'#f59e0b','Baixa':'#6b7d99'};
  const priCounts = {};
  pedidos.forEach(p => { priCounts[p.prioridade] = (priCounts[p.prioridade]||0)+1; });
  const maxPri = Math.max(1, ...Object.values(priCounts));
  document.getElementById('sla-bars').innerHTML = priorities.map(pr => {
    const count = priCounts[pr]||0;
    const pct = Math.round(count/maxPri*100);
    return `<div class="bar-row"><span style="font-size:13px;color:${priColors[pr]}">${pr}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${priColors[pr]}"></div></div><span class="bar-count">${count}</span></div>`;
  }).join('');

  // saving por departamento
  const savingDepto = {};
  pedidos.forEach(p => {
    if (!p.departamento) return;
    if (!savingDepto[p.departamento]) savingDepto[p.departamento] = {pago:0, cotacao:0, saving:0};
    savingDepto[p.departamento].pago += p.valorPago||0;
    savingDepto[p.departamento].cotacao += p.valorCotacao||0;
    savingDepto[p.departamento].saving += p.saving||0;
  });
  const savingDeptoEl = document.getElementById('saving-depto');
  if (savingDeptoEl) {
    const rows = Object.entries(savingDepto)
      .filter(([,v]) => v.cotacao > 0)
      .sort((a,b) => b[1].saving - a[1].saving);
    if (rows.length === 0) {
      savingDeptoEl.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:12px 0">Nenhum dado financeiro ainda. Atualize pedidos para a etapa "Aguardando Pagamento" informando os valores.</div>';
    } else {
      const maxS = Math.max(1, ...rows.map(([,v])=>v.cotacao));
      savingDeptoEl.innerHTML = rows.map(([depto, v]) => {
        const pct = v.cotacao > 0 ? (v.saving/v.cotacao*100) : 0;
        const barPct = Math.round(v.cotacao/maxS*100);
        return `<div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">
            <span>${depto}</span>
            <span style="color:#34d399;font-weight:600">${fmtBRL(v.saving)} <span style="color:var(--muted);font-weight:400">(${fmtPct(pct)})</span></span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
            <div>
              <div style="font-size:10px;color:var(--muted);margin-bottom:2px">Cotação</div>
              <div class="bar-track"><div class="bar-fill" style="width:${barPct}%;background:#f59e0b"></div></div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">${fmtBRL(v.cotacao)}</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--muted);margin-bottom:2px">Pago</div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.round(v.pago/Math.max(1,v.cotacao)*barPct)}%;background:#34d399"></div></div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">${fmtBRL(v.pago)}</div>
            </div>
          </div>
        </div>`;
      }).join('');
    }
  }

  // render monthly chart
  setTimeout(renderComprasChart, 50);

  const late = pedidos.filter(p => p.status !== 'Finalizado' && p.status !== 'Cancelado' && p.status !== 'Conferência' && p.status !== 'Aguardando Identificação' && p.status !== 'Amostragem' && p.status !== 'Aguardando Retirada do Estoque' && p.necessidade && new Date(p.necessidade) < hoje);
  if (late.length === 0) {
    document.getElementById('late-table').innerHTML = '<div class="empty-state" style="padding:30px"><div class="icon">✅</div><h3>Sem atrasos!</h3></div>';
  } else {
    document.getElementById('late-table').innerHTML = `<table><thead><tr><th>SC</th><th>Solicitante</th><th>Status</th><th>Necessidade</th><th>Atraso</th></tr></thead><tbody>${
      late.map(p => {
        const days = Math.floor((hoje - new Date(p.necessidade))/86400000);
        return `<tr class="clickable" onclick="openModal('${p.sc}')"><td><strong>${p.sc}</strong></td><td>${p.solicitante}</td><td><span class="status-badge status-${statusKey(p.status)}">${p.status}</span></td><td>${formatDate(p.necessidade)}</td><td style="color:#ef4444">+${days} dias</td></tr>`;
      }).join('')
    }</tbody></table>`;
  }

  // Mantém o KPI do almoxarifado sincronizado quando essa visão estiver ativa.
  if (window._kpiView === 'almox') {
    try { renderKPIAlmox(); } catch (e) { console.error('Erro ao atualizar KPI Almoxarifado:', e); }
  }
}

// =========================================================
// COMPRAS POR MÊS CHART
// =========================================================
window._chartView = 'total';

function setChartView(view, btn) {
  window._chartView = view;
  document.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderComprasChart();
}

function renderComprasChart() {
  const canvas = document.getElementById('compras-chart');
  const empty = document.getElementById('chart-empty');
  const legend = document.getElementById('chart-legend');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const view = window._chartView;

  // Build last 12 months array
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      label: d.toLocaleDateString('pt-BR', {month:'short', year:'2-digit'}).replace('. ','/')    });
  }

  // Filter pedidos with data
  const pedidosComData = pedidos.filter(p => p.data);

  if (pedidosComData.length === 0) {
    canvas.style.display = 'none';
    empty.style.display = 'block';
    legend.innerHTML = '';
    return;
  }
  canvas.style.display = 'block';
  empty.style.display = 'none';

  const COLORS = [
    '#003a70','#00a99d','#2563eb','#7c3aed','#db2777',
    '#d97706','#059669','#0891b2','#65a30d','#dc2626',
    '#9333ea','#0284c7','#16a34a','#ca8a04','#be185d'
  ];

  let datasets = [];
  let groupKeys = ['Total'];

  if (view === 'total') {
    const counts = {};
    months.forEach(m => counts[m.key] = 0);
    pedidosComData.forEach(p => {
      const key = p.data.substring(0,7);
      if (counts[key] !== undefined) counts[key]++;
    });
    datasets = [{ label: 'Total de Pedidos', data: months.map(m => counts[m.key]), color: '#003a70' }];

  } else if (view === 'empresa') {
    const empresas = [...new Set(pedidosComData.map(p => p.empresa||'Não informado'))].sort();
    groupKeys = empresas;
    datasets = empresas.map((emp, i) => {
      const counts = {};
      months.forEach(m => counts[m.key] = 0);
      pedidosComData.filter(p => (p.empresa||'Não informado') === emp).forEach(p => {
        const key = p.data.substring(0,7);
        if (counts[key] !== undefined) counts[key]++;
      });
      return { label: emp, data: months.map(m => counts[m.key]), color: COLORS[i % COLORS.length] };
    });

  } else if (view === 'setor') {
    const setores = [...new Set(pedidosComData.map(p => p.departamento||'Não informado'))].sort();
    groupKeys = setores;
    datasets = setores.map((dep, i) => {
      const counts = {};
      months.forEach(m => counts[m.key] = 0);
      pedidosComData.filter(p => (p.departamento||'Não informado') === dep).forEach(p => {
        const key = p.data.substring(0,7);
        if (counts[key] !== undefined) counts[key]++;
      });
      return { label: dep, data: months.map(m => counts[m.key]), color: COLORS[i % COLORS.length] };
    });
  }

  // Filter out datasets with all zeros
  datasets = datasets.filter(ds => ds.data.some(v => v > 0));

  // Legend
  legend.innerHTML = datasets.map(ds =>
    `<div style="display:flex;align-items:center;gap:5px;font-size:12px">
      <div style="width:12px;height:12px;border-radius:3px;background:${ds.color};flex-shrink:0"></div>
      <span style="color:var(--muted)">${ds.label}</span>
    </div>`
  ).join('');

  // Draw chart
  const W = canvas.parentElement.offsetWidth || 700;
  const H = 260;
  const PAD = { top: 20, right: 20, bottom: 50, left: 36 };
  canvas.width = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(1, ...datasets.flatMap(ds => ds.data));
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barGroupW = chartW / months.length;
  const barW = Math.max(4, Math.min(24, (barGroupW - 8) / datasets.length));
  const groupOffset = (barGroupW - barW * datasets.length) / 2;

  // Grid lines
  ctx.strokeStyle = '#e2eaf3';
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const y = PAD.top + chartH - (g / 4) * chartH;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    ctx.fillStyle = '#9aacbf';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(maxVal * g / 4), PAD.left - 4, y + 3);
  }

  // Bars
  datasets.forEach((ds, di) => {
    ds.data.forEach((val, mi) => {
      if (val === 0) return;
      const x = PAD.left + mi * barGroupW + groupOffset + di * barW;
      const bh = (val / maxVal) * chartH;
      const y = PAD.top + chartH - bh;
      ctx.fillStyle = ds.color;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, barW - 2, bh, [3,3,0,0]) : ctx.rect(x, y, barW - 2, bh);
      ctx.fill();
      // value label on top if bar is tall enough
      if (bh > 18) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold 9px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(val, x + (barW-2)/2, y + 11);
      }
    });
  });

  // X-axis labels
  ctx.fillStyle = '#6b7f96';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  months.forEach((m, mi) => {
    const x = PAD.left + mi * barGroupW + barGroupW / 2;
    ctx.fillText(m.label, x, H - PAD.bottom + 16);
  });

  // X axis line
  ctx.strokeStyle = '#d1dbe8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD.left, PAD.top + chartH);
  ctx.lineTo(W - PAD.right, PAD.top + chartH);
  ctx.stroke();
}

// =========================================================
// KPI TABS
// =========================================================
window._kpiView = 'compras';

function switchKPI(view) {
  window._kpiView = view;
  document.getElementById('kpi-pane-compras').style.display = view === 'compras' ? 'block' : 'none';
  document.getElementById('kpi-pane-almox').style.display   = view === 'almox'   ? 'block' : 'none';
  const btnC = document.getElementById('btn-kpi-compras');
  const btnA = document.getElementById('btn-kpi-almox');
  if (btnC) btnC.classList.toggle('active', view === 'compras');
  if (btnA) btnA.classList.toggle('active',   view === 'almox');
  const painelTitle = document.getElementById('painel-title');
  if (painelTitle) painelTitle.textContent = view === 'compras' ? 'Painel de KPI' : 'KPI Almoxarifado';
  if (view === 'almox' && !window.compradorMode && window.almoxarifeMode) {
    const btnC = document.getElementById('btn-kpi-compras');
    if (btnC) btnC.style.display = 'none';
  }
  const painelSub = document.getElementById('painel-sub');
  if (painelSub) painelSub.textContent = view === 'compras'
    ? 'Indicadores que impulsionam melhores decisões.'
    : 'Indicadores operacionais do almoxarifado';
  if (view === 'almox') renderKPIAlmox();
}

function renderKPIAlmox() {
  const hoje = new Date();
  const ALMOS = ['Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque'];
  const ALMOS_CORES = {
    'Lançar NF':'#fb923c','Conferência':'#0ea5e9',
    'Aguardando Identificação':'#a855f7','Amostragem':'#ec4899',
    'Aguardando Retirada do Estoque':'#f59e0b'
  };

  // Recebidos no mês atual
  const recebidosMes = pedidos.filter(p => {
    if (!p.dataRecebimento) return false;
    const d = new Date(p.dataRecebimento);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  }).length;

  // Helper: sum a field across all itens of filtered pedidos
  const sumItensField = (filtered, field) =>
    filtered.reduce((s, p) => s + (p.itens||[]).reduce((si, i) => si + (parseFloat(i[field])||0), 0), 0);

  // Pedidos com amostragem registrada
  const pedidosComAmostra = pedidos.filter(p => (p.itens||[]).some(i => i.amoCaixas > 0 || i.amoItens > 0));
  const pedidosComAmostaMes = pedidosComAmostra.filter(p => {
    const d = p.dataAmostragem ? new Date(p.dataAmostragem) : null;
    return d && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });

  // Totais amostragem
  const totalAmoCxMes  = sumItensField(pedidosComAmostaMes, 'amoCaixas');
  const totalAmoCx     = sumItensField(pedidosComAmostra,   'amoCaixas');
  const totalAmoItMes  = sumItensField(pedidosComAmostaMes, 'amoItens');
  const totalAmoIt     = sumItensField(pedidosComAmostra,   'amoItens');

  // Volumes recebidos (campo volume dos itens)
  const pedidosComVolume = pedidos.filter(p => (p.itens||[]).some(i => i.volume > 0));
  const pedidosComVolumeMes = pedidosComVolume.filter(p => {
    const d = p.dataLancarNF ? new Date(p.dataLancarNF) : null;
    return d && d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });
  const totalVolumeMes = sumItensField(pedidosComVolumeMes, 'volume');
  const totalVolume    = sumItensField(pedidosComVolume,    'volume');

  // Em etapas internas agora
  const emEtapas = pedidos.filter(p => ALMOS.includes(p.status)).length;

  // Aguardando retirada
  const aguardRetirada = pedidos.filter(p => p.status === 'Aguardando Retirada do Estoque').length;

  // Atrasados internos: em etapa interna sem atualização há mais de 2 dias
  // Mapeamento de cada etapa para o campo de data correspondente
  const statusDateMap = {
    'Lançar NF':                       'dataLancarNF',
    'Conferência':                     'dataConferencia',
    'Aguardando Identificação':        'dataAguardandoId',
    'Amostragem':                      'dataAmostragem',
    'Aguardando Retirada do Estoque':  'dataAguardandoRet',
  };
  const PRAZO_DIAS = 2;

  const atrasadosInt = pedidos.filter(p => {
    if (!ALMOS.includes(p.status)) return false;
    const dateField = statusDateMap[p.status];
    const dataEntrada = p[dateField] ? new Date(p[dateField]) : (p.dataLancarNF ? new Date(p.dataLancarNF) : null);
    if (!dataEntrada) return false;
    const diasNaEtapa = (hoje - dataEntrada) / 86400000;
    return diasNaEtapa > PRAZO_DIAS;
  }).length;

  document.getElementById('kpi-almox-grid').innerHTML =
    '<div class="kpi-card" style="border-color:rgba(0,169,157,0.2)">'
    + '<div class="kpi-label">📦 Recebidos Este Mês</div>'
    + '<div class="kpi-value accent" style="font-size:26px">' + recebidosMes + '</div>'
    + '<div class="kpi-sub">materiais entregues</div></div>'

    + '<div class="kpi-card" style="border-color:rgba(14,165,233,0.2)">'
    + '<div class="kpi-label">🔄 Em Etapas Internas</div>'
    + '<div class="kpi-value info" style="font-size:26px">' + emEtapas + '</div>'
    + '<div class="kpi-sub">aguardando processamento</div></div>'

    + '<div class="kpi-card" style="border-color:rgba(245,158,11,0.25)">'
    + '<div class="kpi-label">📤 Aguardando Retirada</div>'
    + '<div class="kpi-value warn" style="font-size:26px">' + aguardRetirada + '</div>'
    + '<div class="kpi-sub">pelo cliente interno</div></div>'

    + '<div class="kpi-card" style="border-color:rgba(220,38,38,0.25);cursor:' + (atrasadosInt > 0 ? 'pointer' : 'default') + '" onclick="' + (atrasadosInt > 0 ? 'openAtrasadosAlmoxModal()' : '') + '" title="' + (atrasadosInt > 0 ? 'Clique para ver detalhes' : '') + '">'
    + '<div class="kpi-label">🔴 Atrasados Internos</div>'
    + '<div class="kpi-value danger" style="font-size:26px">' + atrasadosInt + '</div>'
    + '<div class="kpi-sub" style="display:flex;justify-content:space-between;align-items:center">'
    + '<span>+2 dias sem atualização</span>'
    + (atrasadosInt > 0 ? '<span style="color:#dc2626;font-size:11px;font-weight:600">Ver detalhes →</span>' : '')
    + '</div></div>';

  // Second row: amostragem + volume KPIs
  const almoxRow2 = document.getElementById('kpi-almox-grid-2');
  if (almoxRow2) {
    almoxRow2.innerHTML =
      '<div class="kpi-card" style="border-color:rgba(236,72,153,0.2)">'
      + '<div class="kpi-label">🧪 Volumes Amostrados</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#ec4899">' + totalAmoCxMes + '</div>'
      + '<div class="kpi-sub" style="display:flex;justify-content:space-between">'
      + '<span>este mês</span><span style="color:var(--muted)">total: ' + totalAmoCx + '</span></div></div>'

      + '<div class="kpi-card" style="border-color:rgba(236,72,153,0.2)">'
      + '<div class="kpi-label">🧪 Unidades Amostradas</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#ec4899">' + totalAmoItMes + '</div>'
      + '<div class="kpi-sub" style="display:flex;justify-content:space-between">'
      + '<span>este mês</span><span style="color:var(--muted)">total: ' + totalAmoIt + '</span></div></div>'

      + '<div class="kpi-card" style="border-color:rgba(251,146,60,0.2)">'
      + '<div class="kpi-label">📦 Volumes Recebidos</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#fb923c">' + totalVolumeMes + '</div>'
      + '<div class="kpi-sub" style="display:flex;justify-content:space-between">'
      + '<span>este mês</span><span style="color:var(--muted)">total: ' + totalVolume + '</span></div></div>';
  }

  // Render historical month navigator
  renderAlmoxHist();

  // Itens por etapa agora
  const maxEtapa = Math.max(1, ...ALMOS.map(s => pedidos.filter(p => p.status === s).length));
  document.getElementById('almox-etapa-bars').innerHTML = ALMOS.map(st => {
    const count = pedidos.filter(p => p.status === st).length;
    const pct   = Math.round(count / maxEtapa * 100);
    return '<div class="bar-row">'
      + '<span style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px" title="'+st+'">'+st+'</span>'
      + '<div class="bar-track"><div class="bar-fill" style="width:'+pct+'%;background:'+ALMOS_CORES[st]+'"></div></div>'
      + '<span class="bar-count">'+count+'</span></div>';
  }).join('');

  // Tempo médio por etapa (dias entre entrada e saída)
  const tempoMedio = {
    'Conferência':                    { field:'dataConferencia',  prev:'dataLancarNF' },
    'Aguardando Identificação':       { field:'dataAguardandoId', prev:'dataConferencia' },
    'Amostragem':                     { field:'dataAmostragem',   prev:'dataAguardandoId' },
    'Aguardando Retirada do Estoque': { field:'dataAguardandoRet',prev:'dataAmostragem' },
  };
  const maxTempo = 1;
  const tempoRows = Object.entries(tempoMedio).map(([label, {field, prev}]) => {
    const tempos = pedidos
      .filter(p => p[field] && p[prev])
      .map(p => Math.abs((new Date(p[field]) - new Date(p[prev])) / 86400000));
    const avg = tempos.length ? (tempos.reduce((a,b)=>a+b,0)/tempos.length).toFixed(1) : null;
    const pct = avg ? Math.min(100, Math.round(parseFloat(avg) / 10 * 100)) : 0;
    return '<div class="bar-row">'
      + '<span style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px" title="'+label+'">'+label+'</span>'
      + '<div class="bar-track"><div class="bar-fill" style="width:'+pct+'%;background:'+ALMOS_CORES[label]+'"></div></div>'
      + '<span class="bar-count">'+(avg ? avg+'d' : '—')+'</span></div>';
  });
  document.getElementById('almox-tempo-bars').innerHTML = tempoRows.join('');

  // Tabela aguardando retirada
  const retirada = pedidos.filter(p => p.status === 'Aguardando Retirada do Estoque')
    .sort((a,b) => (a.dataAguardandoRet||'').localeCompare(b.dataAguardandoRet||''));

  if (retirada.length === 0) {
    document.getElementById('almox-retirada-table').innerHTML =
      '<div class="empty-state" style="padding:30px"><div class="icon">✅</div><h3>Nenhum material aguardando retirada</h3></div>';
  } else {
    const rows = retirada.map(p => {
      const diasEsp = p.dataAguardandoRet
        ? Math.floor((hoje - new Date(p.dataAguardandoRet)) / 86400000)
        : null;
      return '<tr class="clickable" onclick="openModal(\'' + p.sc + '\')">' 
        + '<td><strong style="color:var(--accent2)">'+p.sc+'</strong></td>'
        + '<td>'+p.empresa+'</td>'
        + '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(p.itens&&p.itens[0]?p.itens[0].descricao:'—')+'</td>'
        + '<td>'+p.departamento+'</td>'
        + '<td>'+p.solicitante+'</td>'
        + '<td>'+(p.dataAguardandoRet ? formatDate(p.dataAguardandoRet) : '—')+'</td>'
        + '<td>'+(diasEsp !== null ? (diasEsp === 0 ? 'Hoje' : diasEsp+'d esperando') : '—')+'</td>'
        + '</tr>';
    }).join('');
    document.getElementById('almox-retirada-table').innerHTML =
      '<table style="width:100%;font-size:13px;border-collapse:collapse">'
      + '<thead><tr><th>SC</th><th>Empresa</th><th>Item</th><th>Depto.</th><th>Solicitante</th><th>Desde</th><th>Espera</th></tr></thead>'
      + '<tbody>'+rows+'</tbody></table>';
  }
}

// =========================================================
// NF DETALHE MODAL
// =========================================================
function openTaxaPrazoModal() {
  const pedidosConcluidos = pedidos.filter(p => p.dataRecebimento && p.necessidade && p.origem !== 'programada');
  if (pedidosConcluidos.length === 0) return;

  const hoje = new Date();
  const noPrazo   = pedidosConcluidos.filter(p => new Date(p.dataRecebimento) <= new Date(p.necessidade));
  const foraPrazo = pedidosConcluidos.filter(p => new Date(p.dataRecebimento) >  new Date(p.necessidade));
  const taxa = Math.round(noPrazo.length / pedidosConcluidos.length * 100);
  const taxaColor = taxa >= 90 ? '#059669' : taxa >= 70 ? '#d97706' : '#dc2626';

  const mkRow = (p, emPrazo) => {
    const diasDiff = Math.round((new Date(p.dataRecebimento) - new Date(p.necessidade)) / 86400000);
    const label = emPrazo
      ? '<span style="color:#059669;font-weight:600">✔ No prazo</span>'
      : '<span style="color:#dc2626;font-weight:600">+' + diasDiff + 'd de atraso</span>';
    return '<tr class="clickable" onclick="closeModal();setTimeout(()=>openModal(\'' + p.sc + '\'),100)">'
      + '<td><strong style="color:var(--accent2)">' + p.sc + '</strong></td>'
      + '<td>' + (p.empresa||'—') + '</td>'
      + '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.itens&&p.itens[0]?p.itens[0].descricao:'—') + '</td>'
      + '<td>' + (p.departamento||'—') + '</td>'
      + '<td>' + formatDate(p.necessidade) + '</td>'
      + '<td>' + formatDate(p.dataRecebimento) + '</td>'
      + '<td>' + label + '</td>'
      + '</tr>';
  };

  // Show fora do prazo first, then no prazo
  const rows = [...foraPrazo.sort((a,b)=>(new Date(b.dataRecebimento)-new Date(b.necessidade))-(new Date(a.dataRecebimento)-new Date(a.necessidade))), ...noPrazo].map((p,i) => mkRow(p, i >= foraPrazo.length)).join('');

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">'
    + '<div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700">✅ Taxa de Pedidos no Prazo</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">' + pedidosConcluidos.length + ' pedidos analisados</div></div>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">'
    + '<div style="background:rgba(5,150,105,0.07);border:1px solid rgba(5,150,105,0.2);border-radius:10px;padding:14px;text-align:center">'
    + '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">TAXA GERAL</div>'
    + '<div style="font-size:28px;font-weight:700;color:'+taxaColor+'">'+taxa+'%</div></div>'
    + '<div style="background:rgba(5,150,105,0.07);border:1px solid rgba(5,150,105,0.2);border-radius:10px;padding:14px;text-align:center">'
    + '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">NO PRAZO</div>'
    + '<div style="font-size:28px;font-weight:700;color:#059669">'+noPrazo.length+'</div></div>'
    + '<div style="background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:14px;text-align:center">'
    + '<div style="font-size:11px;color:var(--muted);margin-bottom:4px">FORA DO PRAZO</div>'
    + '<div style="font-size:28px;font-weight:700;color:#dc2626">'+foraPrazo.length+'</div></div>'
    + '</div>'
    + '<table style="width:100%;font-size:13px;border-collapse:collapse">'
    + '<thead><tr><th>SC</th><th>Empresa</th><th>Item</th><th>Depto.</th><th>Necessidade</th><th>Recebido em</th><th>Resultado</th></tr></thead>'
    + '<tbody>' + rows + '</tbody></table>'
    + '<div style="margin-top:16px;text-align:right"><button class="btn btn-secondary" onclick="closeModal()">Fechar</button></div>';
  document.getElementById('modal-overlay').classList.add('open');
}

function openNFDetalhe() {
  const pendentes = pedidos.filter(p => p.status === 'Lançar NF');
  const hoje = new Date();

  if (pendentes.length === 0) {
    toast('Nenhum pedido pendente em Lançar NF', 'success');
    return;
  }

  pendentes.sort((a,b) => {
    const da = a.dataLancarNF ? new Date(a.dataLancarNF) : new Date();
    const db = b.dataLancarNF ? new Date(b.dataLancarNF) : new Date();
    return da - db;
  });

  const rows = pendentes.map(p => {
    const entrada = p.dataLancarNF ? new Date(p.dataLancarNF) : null;
    const dias    = entrada ? Math.floor((hoje - entrada) / 86400000) : null;
    const cor     = dias === null ? 'var(--muted)' : dias > 2 ? '#dc2626' : dias > 0 ? '#d97706' : '#059669';
    return '<tr class="clickable" onclick="closeModal();setTimeout(()=>openModal(\'' + p.sc + '\'),100)">' 
      + '<td><strong style="color:var(--accent2)">'+p.sc+'</strong></td>'
      + '<td>'+(p.empresa||'—')+'</td>'
      + '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(p.itens&&p.itens[0]?p.itens[0].descricao:'—')+'</td>'
      + '<td>'+(p.departamento||'—')+'</td>'
      + '<td>'+(p.dataLancarNF ? formatDate(p.dataLancarNF) : '—')+'</td>'
      + '<td><strong style="color:'+cor+'">'+(dias !== null ? dias+'d' : '—')+'</strong></td>'
      + '</tr>';
  }).join('');

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">'
    + '<div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700">🧾 Pendentes — Lançar NF</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">'+pendentes.length+' pedido'+(pendentes.length>1?'s':'')+' aguardando lançamento</div></div>'
    + '<button class="modal-close" onclick="closeModal()">✕</button>'
    + '</div>'
    + '<table style="width:100%;font-size:13px;border-collapse:collapse">'
    + '<thead><tr><th>SC</th><th>Empresa</th><th>Item</th><th>Depto.</th><th>Chegou em</th><th>Dias</th></tr></thead>'
    + '<tbody>'+rows+'</tbody>'
    + '</table>'
    + '<div style="margin-top:16px;text-align:right"><button class="btn btn-secondary" onclick="closeModal()">Fechar</button></div>';

  document.getElementById('modal-overlay').classList.add('open');
}

// =========================================================
// SAVING MODAL
// =========================================================
function openSavingModal(tipo) {
  const pedidosComSaving = tipo === 'cotacao'
    ? pedidos.filter(p => p.saving > 0)
    : pedidos.filter(p => p.savingRef > 0);

  pedidosComSaving.sort((a,b) => (tipo === 'cotacao' ? b.saving - a.saving : b.savingRef - a.savingRef));

  const totalS = pedidosComSaving.reduce((s,p) => s + (tipo === 'cotacao' ? p.saving : p.savingRef), 0);
  const titulo = tipo === 'cotacao' ? 'Saving: Cotação → Pago' : 'Saving: Referência → Pago';
  const cor = tipo === 'cotacao' ? '#34d399' : '#60a5fa';

  const rows = pedidosComSaving.map(p => {
    const sv = tipo === 'cotacao' ? p.saving : p.savingRef;
    const base = tipo === 'cotacao' ? p.valorCotacao : p.valorRef;
    const pct = base > 0 ? (sv/base*100).toFixed(1) : 0;
    return `<tr class="clickable" onclick="closeModal();setTimeout(()=>openModal('${p.sc}'),100)">
      <td><strong style="color:var(--accent)">${p.sc}</strong></td>
      <td>${p.empresa||'—'}</td>
      <td>${p.solicitante}</td>
      <td>${p.departamento||'—'}</td>
      <td style="color:var(--muted)">${fmtBRL(base)}</td>
      <td style="color:var(--muted)">${fmtBRL(p.valorPago)}</td>
      <td><strong style="color:${cor}">${fmtBRL(sv)}</strong></td>
      <td style="color:${cor}">${pct}%</td>
    </tr>`;
  }).join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div>
        <div style="font-family:'Inter',sans-serif;font-size:20px;font-weight:700">📉 ${titulo}</div>
        <div style="color:var(--muted);font-size:13px;margin-top:4px">${pedidosComSaving.length} pedido${pedidosComSaving.length !== 1 ? 's' : ''} com saving registrado</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:16px;text-align:center">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Total Economizado</div>
        <div style="font-size:24px;font-weight:700;font-family:'Inter',sans-serif;color:${cor}">${fmtBRL(totalS)}</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Pedidos com Saving</div>
        <div style="font-size:24px;font-weight:700;font-family:'Inter',sans-serif;color:var(--text)">${pedidosComSaving.length}</div>
      </div>
    </div>

    <div style="overflow-x:auto">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:1px solid var(--border)">
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">SC</th>
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">Empresa</th>
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">Solicitante</th>
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">Depto.</th>
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">${tipo === 'cotacao' ? '1ª Cotação' : 'Referência'}</th>
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">Valor Pago</th>
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">Saving</th>
            <th style="padding:8px 12px;text-align:left;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.8px">%</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="margin-top:16px;text-align:right">
      <button class="btn btn-secondary" onclick="closeModal()">Fechar</button>
    </div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

// =========================================================
// PROGRAMADAS TABLE
// =========================================================
function toggleHistoricoFinalizadas() {
  const el   = document.getElementById('historico-finalizadas');
  const icon = document.getElementById('hist-toggle-icon');
  const open = el.style.display === 'none';
  el.style.display = open ? 'block' : 'none';
  icon.textContent = open ? '▲ recolher' : '▼ expandir';
  if (open) renderHistoricoFinalizadas();
}

function renderHistoricoFinalizadas() {
  const q = (document.getElementById('filterHistorico')?.value||'').toLowerCase();
  const finalizadas = pedidos.filter(p =>
    p.origem === 'programada' && p.status === 'Finalizado' &&
    (!q || (p.itens||[]).some(i=>i.descricao.toLowerCase().includes(q))
        || (p.empresa||'').toLowerCase().includes(q)
        || (p.fornecedorEsc||p.fornecedorSug||'').toLowerCase().includes(q))
  ).sort((a,b) => (b.dataFinalizado||'').localeCompare(a.dataFinalizado||''));

  const el = document.getElementById('historico-table');
  if (!el) return;

  if (finalizadas.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:28px;color:var(--muted);font-size:13px">Nenhuma compra programada finalizada ainda</div>';
    return;
  }

  const rows = finalizadas.map(p =>
    '<tr class="clickable" onclick="openModal(\'' + p.sc + '\')">'  
    + '<td><strong style="color:var(--accent2)">' + p.sc + '</strong></td>'
    + '<td>' + (p.empresa||'—') + '</td>'
    + '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.itens&&p.itens[0]?p.itens[0].descricao:'—') + '</td>'
    + '<td>' + (p.departamento||'—') + '</td>'
    + '<td>' + (p.fornecedorEsc||p.fornecedorSug||'—') + '</td>'
    + '<td>' + (p.valorPago ? fmtBRL(p.valorPago) : '—') + '</td>'
    + '<td>' + (p.saving ? '<span style="color:#059669;font-weight:600">' + fmtBRL(p.saving) + '</span>' : '—') + '</td>'
    + '<td>' + (p.dataFinalizado ? formatDate(p.dataFinalizado) : '—') + '</td>'
    + '<td>' + (p.proximaCompra ? formatDate(p.proximaCompra) : '—') + '</td>'
    + '</tr>'
  ).join('');

  el.innerHTML =
    '<table style="width:100%;font-size:13px;border-collapse:collapse">'
    + '<thead><tr>'
    + '<th>SC</th><th>Empresa</th><th>Item</th><th>Depto.</th>'
    + '<th>Fornecedor</th><th>Valor Pago</th><th>Saving</th>'
    + '<th>Finalizado em</th><th>Próxima Compra</th>'
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table>';
}

function toggleProgStatusFilter(btn) {
  const status = btn.dataset.status;
  const allBtn = document.querySelector('#prog-status-filter-group .status-filter-btn[data-status=""]');
  if (status === '') {
    document.querySelectorAll('#prog-status-filter-group .status-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    allBtn.classList.remove('active');
    btn.classList.toggle('active');
    const anyActive = [...document.querySelectorAll('#prog-status-filter-group .status-filter-btn.active')].some(b => b.dataset.status !== '');
    if (!anyActive) allBtn.classList.add('active');
  }
  renderProgramadasTable();
}

function renderProgramadasTable() {
  const q    = (document.getElementById('filterProg')?.value||'').toLowerCase();
  const hoje = new Date();
  const activeProgStatuses = [...document.querySelectorAll('#prog-status-filter-group .status-filter-btn.active')]
    .map(b => b.dataset.status).filter(s => s !== '');

  const prog = pedidos.filter(p =>
    p.origem === 'programada' &&
    p.status !== 'Finalizado' &&
    (!q || (p.itens||[]).some(i=>i.descricao.toLowerCase().includes(q))
        || (p.empresa||'').toLowerCase().includes(q)
        || (p.departamento||'').toLowerCase().includes(q)
        || (p.fornecedorEsc||'').toLowerCase().includes(q)
        || (p.fornecedorSug||'').toLowerCase().includes(q)) &&
    (activeProgStatuses.length === 0 || activeProgStatuses.includes(p.status))
  );

  // KPI cards
  const totalProg   = pedidos.filter(p => p.origem === 'programada').length;
  const totalValor  = pedidos.filter(p => p.origem === 'programada').reduce((s,p)=>s+(p.valorPago||0),0);
  const proximosEntrega = prog.filter(p => {
    if (!p.previsaoEntrega) return false;
    const d = new Date(p.previsaoEntrega);
    return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth() && p.status !== 'Finalizado';
  }).length;
  const atrasados = prog.filter(p => p.previsaoEntrega && new Date(p.previsaoEntrega) < hoje && p.status !== 'Finalizado').length;

  document.getElementById('prog-kpi-row').innerHTML =
    '<div class="kpi-card"><div class="kpi-label">Total Programadas</div><div class="kpi-value accent" style="font-size:26px">'+totalProg+'</div><div class="kpi-sub">contratos ativos</div></div>'
   +'<div class="kpi-card" style="border-color:rgba(0,169,157,0.2)"><div class="kpi-label">💰 Volume Total</div><div class="kpi-value" style="font-size:22px;color:#00a99d">'+fmtBRL(totalValor)+'</div><div class="kpi-sub">soma dos valores pagos</div></div>'
   +'<div class="kpi-card" style="border-color:rgba(245,158,11,0.25)"><div class="kpi-label">📦 Próximos à Entrega</div><div class="kpi-value warn" style="font-size:26px">'+proximosEntrega+'</div><div class="kpi-sub">entrega prevista neste mes</div></div>'
   +'<div class="kpi-card" style="border-color:rgba(220,38,38,0.25)"><div class="kpi-label">🔴 Pedidos Atrasados</div><div class="kpi-value danger" style="font-size:26px">'+atrasados+'</div><div class="kpi-sub">entrega nao realizada no prazo</div></div>';

  if (prog.length === 0) {
    document.getElementById('programadas-table').innerHTML =
      '<div class="empty-state" style="padding:40px"><div class="icon">📅</div><h3>Nenhuma compra programada</h3><p>Use o Lancamento Direto (Modo Comprador) para registrar compras programadas</p></div>';
    return;
  }

  // sort: vencidas first, then by proximaCompra asc
  prog.sort((a,b) => {
    const da = a.proximaCompra ? new Date(a.proximaCompra) : new Date('9999-01-01');
    const db = b.proximaCompra ? new Date(b.proximaCompra) : new Date('9999-01-01');
    return da - db;
  });

  const rows = prog.map(p => {
    const isVencida  = p.previsaoEntrega && new Date(p.previsaoEntrega) < hoje && p.status !== 'Finalizado';
    const isVencendo = p.previsaoEntrega && !isVencida && new Date(p.previsaoEntrega).getMonth() === hoje.getMonth() && new Date(p.previsaoEntrega).getFullYear() === hoje.getFullYear() && p.status !== 'Finalizado';
    const alertColor = isVencida ? '#dc2626' : isVencendo ? '#d97706' : 'var(--muted)';
    const alertIcon  = isVencida ? '🔴' : isVencendo ? '⚠️' : '✅';
    const diasProx   = p.proximaCompra
      ? Math.ceil((new Date(p.proximaCompra) - hoje) / 86400000)
      : null;
    const diasLabel  = diasProx === null ? '—'
      : diasProx < 0  ? '<span style="color:#dc2626;font-weight:600">'+Math.abs(diasProx)+'d atraso</span>'
      : diasProx === 0 ? '<span style="color:#d97706;font-weight:600">Hoje</span>'
      : '<span style="color:'+alertColor+'">em '+diasProx+'d</span>';

    return '<tr class="clickable" onclick="openModal(\'' + p.sc + '\')">' 
      +'<td><strong style="color:var(--accent2)">'+p.sc+'</strong></td>'
      +'<td>'+p.empresa+'</td>'
      +'<td>'+(p.itens&&p.itens[0]?p.itens[0].descricao:'—')+'</td>'
      +'<td>'+p.departamento+'</td>'
      +'<td>'+(p.fornecedorEsc||p.fornecedorSug||'—')+'</td>'
      +'<td><span class="status-badge status-'+statusKey(p.status)+'">'+p.status+'</span></td>'
      +'<td>'+(p.valorPago ? fmtBRL(p.valorPago) : '—')+'</td>'
      +'<td>'+(p.proximaCompra ? formatDate(p.proximaCompra) : '—')+'</td>'
      +'<td>'+diasLabel+'</td>'
      +'<td>'+(p.previsaoEntrega ? formatDate(p.previsaoEntrega) : '—')+'</td>'
      +'<td>'+alertIcon+'</td>'
      +'</tr>';
  }).join('');

  renderHistoricoFinalizadas();

  document.getElementById('programadas-table').innerHTML =
    '<table style="width:100%;font-size:13px;border-collapse:collapse">'
    +'<thead><tr>'
    +'<th>SC</th><th>Empresa</th><th>Item</th><th>Depto.</th>'
    +'<th>Fornecedor</th><th>Status</th><th>Valor Pago</th>'
    +'<th>Próxima Compra</th><th>Tempo</th>'
    +'<th>Prev. Entrega</th><th></th>'
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table>';
}

// =========================================================
// PEDIDOS TABLE
// =========================================================
function toggleStatusFilter(btn) {
  const status = btn.dataset.status;
  const allBtn = document.querySelector('#status-filter-group .status-filter-btn[data-status=""]');

  if (status === '') {
    // "Todos" clicked — clear all, activate only Todos
    document.querySelectorAll('#status-filter-group .status-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    // deactivate "Todos"
    allBtn.classList.remove('active');
    btn.classList.toggle('active');
    // if nothing selected, re-activate Todos
    const anyActive = [...document.querySelectorAll('#status-filter-group .status-filter-btn.active')].some(b => b.dataset.status !== '');
    if (!anyActive) allBtn.classList.add('active');
  }
  renderPedidosTable();
}

function renderPedidosTable() {
  const q = (document.getElementById('filterInput').value||'').toLowerCase();
  const activeStatuses = [...document.querySelectorAll('.status-filter-btn.active')]
    .map(b => b.dataset.status).filter(s => s !== '');

  const statusOrder = ['Solicitado','Cotação','Pedido de Compra','Aguardando Pagamento','A Caminho','Recebimento Parcial','Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado','Cancelado'];

  const filtered = pedidos.filter(p =>
    (!q || p.sc.toLowerCase().includes(q) || p.solicitante.toLowerCase().includes(q) || p.itens.some(i=>i.descricao.toLowerCase().includes(q))) &&
    (activeStatuses.length === 0 || activeStatuses.includes(p.status))
  ).sort((a, b) => {
    const ia = statusOrder.indexOf(a.status);
    const ib = statusOrder.indexOf(b.status);
    if (ia !== ib) return ia - ib;
    return a.sc.localeCompare(b.sc);
  });

  const pedidosKpi = document.getElementById('pedidos-kpi-row');
  if (pedidosKpi) {
    const totalPedidos = pedidos.length;
    const valorTotal = pedidos.reduce((s,p)=>s+(Number(p.valorPago)||0),0);
    const entregues = pedidos.filter(p=>p.status==='Finalizado').length;
    const andamento = pedidos.filter(p=>!['Finalizado','Cancelado'].includes(p.status)).length;
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const atrasados = pedidos.filter(p=>!['Finalizado','Cancelado'].includes(p.status) && p.necessidade && new Date(p.necessidade) < hoje).length;
    pedidosKpi.innerHTML = `
      <div class="kpi-card kv-kpi-blue"><div class="kpi-label">📋 Pedidos no período</div><div class="kpi-value">${totalPedidos}</div><div class="kpi-sub">pedidos registrados</div></div>
      <div class="kpi-card kv-kpi-mint"><div class="kpi-label">💰 Valor total</div><div class="kpi-value">${fmtBRL(valorTotal)}</div><div class="kpi-sub">valor efetivamente pago</div></div>
      <div class="kpi-card kv-kpi-green"><div class="kpi-label">✅ Pedidos entregues</div><div class="kpi-value">${entregues}</div><div class="kpi-sub">finalizados</div></div>
      <div class="kpi-card kv-kpi-blue"><div class="kpi-label">🕒 Em andamento</div><div class="kpi-value">${andamento}</div><div class="kpi-sub">em processamento</div></div>
      <div class="kpi-card kv-kpi-red"><div class="kpi-label">🔴 Atrasados</div><div class="kpi-value">${atrasados}</div><div class="kpi-sub">acima da necessidade</div></div>`;
  }

  if (filtered.length === 0) {
    document.getElementById('pedidos-table').innerHTML = '<div class="empty-state" style="padding:40px"><div class="icon">📦</div><h3>Nenhum pedido</h3><p>Carregue uma planilha Excel ou crie novas solicitações</p></div>';
    return;
  }

  document.getElementById('pedidos-table').innerHTML = `
    <table>
      <thead><tr><th>SC</th><th>Item</th><th>Tipo</th><th>Empresa</th><th>Data</th><th>Solicitante</th><th>Depto.</th><th>Prioridade</th><th>Status</th><th>Necessidade</th><th>PC</th><th>Fat. Adiant.</th><th>NF Entrada</th>${window.compradorMode ? '<th></th>' : ''}</tr></thead>
      <tbody>${filtered.map(p => `
        <tr class="clickable" onclick="openModal('${p.sc}')">
          <td><strong style="color:var(--accent)">${p.sc}</strong></td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.itens&&p.itens[0]?p.itens[0].descricao:''}">${p.itens&&p.itens[0]?p.itens[0].descricao+(p.itens.length>1?' <span style="color:var(--muted);font-size:11px">+${p.itens.length-1}</span>':''):'—'}</td>
          <td>${p.origem==='reposicao'?'<span style="color:#00a99d;font-size:11px;font-weight:600">Reposicao</span>':p.origem==='programada'?'<span style="color:#7c3aed;font-size:11px;font-weight:600">Programada</span>':'<span style="color:var(--muted);font-size:11px">Formulario</span>'}</td>
          <td>${p.empresa||'—'}</td>
          <td>${formatDate(p.data)}</td>
          <td>${p.solicitante}</td>
          <td>${p.departamento||'—'}</td>
          <td><span class="priority-${p.prioridade.toLowerCase()}">${p.prioridade}</span></td>
          <td><span class="status-badge status-${statusKey(p.status)}">${p.status}</span></td>
          <td>${formatDate(p.necessidade)}</td>
          <td>${p.docPC ? `<span style="color:var(--accent);font-size:12px">${p.docPC}</span>` : '<span style="color:var(--muted);font-size:12px">—</span>'}</td>
          <td>${p.docFatura ? `<span style="color:#f59e0b;font-size:12px">${p.docFatura}</span>` : '<span style="color:var(--muted);font-size:12px">—</span>'}</td>
          <td>${p.docNFE ? `<span style="color:#34d399;font-size:12px">${p.docNFE}</span>` : '<span style="color:var(--muted);font-size:12px">—</span>'}</td>
          ${window.compradorMode ? `<td onclick="event.stopPropagation()"><button onclick="confirmarExclusao('${p.sc}')" style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.2);color:#dc2626;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:12px">🗑</button></td>` : ''}
        </tr>
      `).join('')}</tbody>
    </table>`;
}

// =========================================================
// EXCEL
// =========================================================
function loadExcel(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(e.target.result, {type:'binary'});
      const sheetName = wb.SheetNames.includes('Pedidos') ? 'Pedidos' : wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, {header:1});

      if (data.length < 2) { toast('Planilha vazia ou sem dados', 'error'); return; }

      pedidos = [];
      for (let i = 1; i < data.length; i++) {
        const r = data[i];
        if (!r[0]) continue;
        pedidos.push({
          sc: r[0]||'',
          data: excelDate(r[1]),
          solicitante: r[2]||'',
          departamento: r[3]||'',
          cc: r[4]||'',
          prioridade: r[5]||'Média',
          necessidade: excelDate(r[6]),
          tipo: r[7]||'',
          itens: [{ descricao: r[8]||'', qtd:'1', unidade:'Un', ref:'' }],
          fornecedorSug: r[9]||'',
          valorEstimado: r[10]||'',
          justificativa: r[11]||'',
          aprovador: r[12]||'',
          status: r[13]||'Solicitado',
          fornecedorEsc: r[14]||'',
          nfPedido: r[15]||'',
          dataPedido: excelDate(r[16]),
          previsaoEntrega: excelDate(r[17]),
          dataRecebimento: excelDate(r[18]),
          recebidoPor: r[19]||'',
          obs: r[20]||'',
        });
      }

      document.getElementById('excelStatus').className = 'excel-badge';
      document.getElementById('excelStatus').innerHTML = `<div class="dot"></div><span>${pedidos.length} pedidos carregados</span>`;
      toast(`✔ ${pedidos.length} pedidos importados de "${file.name}"`, 'success');
    } catch(err) {
      toast('Erro ao ler planilha: ' + err.message, 'error');
    }
  };
  reader.readAsBinaryString(file);
}

function excelDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569)*86400*1000));
    return d.toISOString().split('T')[0];
  }
  if (typeof val === 'string') return val;
  return '';
}

// =========================================================
// TEMPLATE DOWNLOAD
// =========================================================
function downloadTemplate() {
  const header = COLUMNS.map(c => c.name);
  const example = COLUMNS.map(c => c.ex);
  const ws = XLSX.utils.aoa_to_sheet([header, example]);
  ws['!cols'] = COLUMNS.map(() => ({wch:22}));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
  XLSX.writeFile(wb, 'Kovalent_Controle_Compras_Modelo.xlsx');
  toast('Modelo Excel baixado!', 'success');
}

// =========================================================
// COL MODEL TABLE
// =========================================================
function renderColModel() {
  document.getElementById('col-model').innerHTML = COLUMNS.map(c => `
    <tr>
      <td style="padding:8px 14px; font-family:monospace; color:var(--accent)">${c.col}</td>
      <td style="padding:8px 14px">${c.name}</td>
      <td style="padding:8px 14px; color:var(--muted); font-size:12px">${c.ex}</td>
      <td style="padding:8px 14px">${c.req ? '<span style="color:#34d399">✔ Sim</span>' : '<span style="color:var(--muted)">Não</span>'}</td>
    </tr>
  `).join('');
}

// =========================================================
// HELPERS
// =========================================================
function statusKey(s) {
  const map = { 'Solicitado':'solicitado', 'Cotação':'cotacao', 'Pedido de Compra':'pedidocompra', 'Aguardando Pagamento':'aguardando', 'A Caminho':'acaminho', 'Recebimento Parcial':'recebimentoparcial', 'Lançar NF':'lancarnf', 'Conferência':'conferencia', 'Aguardando Identificação':'aguardandoid', 'Amostragem':'amostragem', 'Aguardando Retirada do Estoque':'aguardandoretirada', 'Finalizado':'finalizado', 'Cancelado':'cancelado' };
  return map[s]||'solicitado';
}

function stepStatus(current, step) {
  const order = ['Solicitado','Cotação','Pedido de Compra','Aguardando Pagamento','A Caminho','Recebimento Parcial','Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado'];
  const ci = order.indexOf(current);
  const si = order.indexOf(step);
  if (ci > si) return 'done';
  if (ci === si) return 'active';
  return 'pending';
}

function formatDate(d) {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function toast(msg, type='success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='success'?'✔':'⚠'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// =========================================================
// MODO COMPRADOR
// =========================================================
window.compradorMode = false;
window._pendingTab = null;
const COMPRADOR_PASSWORD = 'Kovalent@123'; // ← altere aqui

function requireComprador(tab) {
  if (window.compradorMode) { switchTab(tab); return; }
  // almoxarife can access painel but only the almox KPI view
  if (window.almoxarifeMode && tab === 'painel') {
    switchTab('painel');
    // force almox KPI view and hide compras tab button
    setTimeout(() => {
      switchKPI('almox');
      const btnCompras = document.getElementById('btn-kpi-compras');
      if (btnCompras) btnCompras.style.display = 'none';
    }, 50);
    return;
  }
  window._pendingTab = tab;
  openPwdModal();
}

function openPwdModal() {
  document.getElementById('pwd-input').value = '';
  document.getElementById('pwd-error').textContent = '';
  document.getElementById('pwd-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('pwd-input').focus(), 100);
}

function closePwdModal() {
  document.getElementById('pwd-overlay').style.display = 'none';
  window._pendingTab = null;
}

function checkPassword() {
  const val = document.getElementById('pwd-input').value;
  if (val === COMPRADOR_PASSWORD) {
    closePwdModal();
    enableCompradorMode();
    if (window._pendingTab) { switchTabDirect(window._pendingTab); window._pendingTab = null; }
  } else {
    document.getElementById('pwd-error').textContent = 'Senha incorreta. Tente novamente.';
    document.getElementById('pwd-input').value = '';
    document.getElementById('pwd-input').focus();
    // shake animation
    const inp = document.getElementById('pwd-input');
    inp.style.borderColor = '#dc2626';
    setTimeout(() => inp.style.borderColor = '#d1dbe8', 1200);
  }
}

function enableCompradorMode() {
  window.compradorMode = true;
  // unlock nav tabs
  ['painel','config'].forEach(tab => {
    const btn = document.getElementById('nav-' + tab);
    btn.classList.remove('locked');
    btn.setAttribute('onclick', `switchTab('${tab}')`);
    btn.querySelector('.lock-icon').textContent = '';
  });
  // update header button
  const modeBtn = document.getElementById('btn-modo-comprador');
  modeBtn.style.background = 'linear-gradient(135deg,#003a70,#005a9e)';
  modeBtn.style.color = '#fff';
  modeBtn.style.borderColor = '#003a70';
  document.getElementById('modo-icon').textContent = '🔓';
  document.getElementById('modo-label').textContent = 'Comprador Ativo';
  document.getElementById('btn-lancamento-direto').style.display = 'flex';
  // restore KPI compras button visibility
  const btnKpiC = document.getElementById('btn-kpi-compras');
  if (btnKpiC) btnKpiC.style.display = '';
  toast('✔ Modo Comprador ativado', 'success');
}

function toggleModoComprador() {
  if (!window.compradorMode) {
    openPwdModal();
  } else {
    // logout
    window.compradorMode = false;
    ['painel','config'].forEach(tab => {
      const btn = document.getElementById('nav-' + tab);
      btn.classList.add('locked');
      btn.setAttribute('onclick', `requireComprador('${tab}')`);
      btn.querySelector('.lock-icon').textContent = '🔒';
    });
    // if currently on a restricted tab, go back to solicitar
    const restricted = ['painel','config'];
    const activePane = document.querySelector('.tab-pane.active');
    if (activePane && restricted.includes(activePane.id.replace('tab-',''))) {
      switchTabDirect('solicitar');
    }
    const modeBtn = document.getElementById('btn-modo-comprador');
    modeBtn.style.background = 'transparent';
    modeBtn.style.color = '#003a70';
    modeBtn.style.borderColor = '#003a70';
    document.getElementById('modo-icon').textContent = '🔒';
    document.getElementById('modo-label').textContent = 'Modo Comprador';
    document.getElementById('btn-lancamento-direto').style.display = 'none';
    toast('Modo Comprador desativado', 'success');
  }
}

// Internal tab switcher that bypasses the lock check (used after auth)
function switchTabDirect(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  const navBtn = document.getElementById('nav-' + name);
  if (navBtn) navBtn.classList.add('active');
  if (name === 'painel') renderDashboard();
  if (name === 'pedidos') renderPedidosTable();
  if (name === 'programadas') renderProgramadasTable();
}


// LANCAMENTO DIRETO
window._ldTipo = null;

let ldItemCount = 0;

function addLDItemRow() {
  ldItemCount++;
  const id = ldItemCount;
  const row = document.createElement('div');
  row.className = 'item-row';
  row.id = 'ld-item-' + id;
  row.innerHTML = `
    <input type="text" placeholder="Descricao do item ${id}" style="background:transparent;border:1px solid transparent;padding:6px 8px;font-size:13px;width:100%">
    <select style="background:transparent;border:1px solid transparent;padding:6px 8px;font-size:13px">
      <option>Un</option><option>Kg</option><option>L</option>
      <option>mL</option><option>g</option><option>mg</option>
      <option>Cx</option><option>Pc</option><option>Pares</option>
    </select>
    <input type="number" placeholder="0" min="0" step="0.01" style="background:transparent;border:1px solid transparent;padding:6px 8px;font-size:13px;width:100%">
    <input type="text" placeholder="Codigo / Ref." style="background:transparent;border:1px solid transparent;padding:6px 8px;font-size:13px;width:100%">
    <button class="btn-icon" onclick="document.getElementById('ld-item-${id}').remove()" title="Remover">&#x2715;</button>
  `;
  // focus effect on inputs
  row.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('focus', () => { el.style.background='var(--surface)'; el.style.borderColor='var(--accent2)'; });
    el.addEventListener('blur',  () => { el.style.background='transparent';    el.style.borderColor='transparent'; });
  });
  document.getElementById('ld-items-body').appendChild(row);
}

function getLDItems() {
  const rows = document.querySelectorAll('#ld-items-body .item-row');
  const items = [];
  rows.forEach(r => {
    const inputs = r.querySelectorAll('input, select');
    const desc = inputs[0].value.trim();
    if (desc) items.push({ descricao: desc, unidade: inputs[1].value, qtd: inputs[2].value||'1', ref: inputs[3].value });
  });
  return items;
}

async function handlePDFUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const status = document.getElementById('pdf-status');
  status.style.display = 'block';
  status.innerHTML = '<span style="color:#003a70">⏳ Analisando documento com IA...</span>';

  try {
    // Read file as base64
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    const isPDF = file.type === 'application/pdf';
    const mediaType = isPDF ? 'application/pdf' : file.type;

    const prompt = `Analise este documento (nota fiscal, cotação ou pedido de compra) e extraia as informações relevantes.
Retorne APENAS um JSON válido, sem markdown, sem explicações, no seguinte formato:
{
  "fornecedor": "nome do fornecedor/empresa emissora",
  "itens": [
    {"descricao": "descrição do item", "qtd": "quantidade", "unidade": "unidade de medida", "ref": "código/referência se houver"}
  ],
  "valorTotal": "valor total numérico sem formatação",
  "dataDocumento": "data no formato YYYY-MM-DD se encontrada",
  "numeroDocumento": "número da NF ou pedido se houver",
  "obs": "observações relevantes"
}
Se algum campo não for encontrado, use string vazia. Itens deve ter pelo menos 1 entrada.`;

    const msgContent = isPDF
      ? [{ type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } }, { type: 'text', text: prompt }]
      : [{ type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64 } }, { type: 'text', text: prompt }];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: msgContent }]
      })
    });

    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Fill form fields
    if (parsed.fornecedor) {
      const fEl = document.getElementById('ld-fornecedor');
      if (fEl) fEl.value = parsed.fornecedor;
    }
    if (parsed.valorTotal) {
      const vEl = document.getElementById('ld-valor');
      if (vEl) vEl.value = parseFloat(parsed.valorTotal.toString().replace(',','.')) || '';
    }
    if (parsed.obs) {
      const oEl = document.getElementById('ld-obs');
      if (oEl) oEl.value = parsed.obs;
    }
    if (parsed.dataDocumento) {
      const dEl = document.getElementById('ld-data');
      if (dEl) dEl.value = parsed.dataDocumento;
    }

    // Fill items
    if (parsed.itens && parsed.itens.length > 0) {
      document.getElementById('ld-items-body').innerHTML = '';
      ldItemCount = 0;
      parsed.itens.forEach(item => {
        addLDItemRow();
        const rows = document.querySelectorAll('#ld-items-body .item-row');
        const lastRow = rows[rows.length - 1];
        const inputs = lastRow.querySelectorAll('input, select');
        if (inputs[0]) inputs[0].value = item.descricao || '';
        if (inputs[1] && item.unidade) {
          // try to match unit
          const opts = [...inputs[1].options].map(o => o.value.toLowerCase());
          const match = opts.findIndex(o => o === (item.unidade||'').toLowerCase());
          if (match > -1) inputs[1].selectedIndex = match;
        }
        if (inputs[2]) inputs[2].value = item.qtd || '1';
        if (inputs[3]) inputs[3].value = item.ref || '';
      });
    }

    const count = parsed.itens ? parsed.itens.length : 0;
    status.innerHTML = '<span style="color:#059669">✔ Documento lido com sucesso! ' + count + ' item(ns) preenchido(s). Revise antes de confirmar.</span>';
    input.value = '';

  } catch (err) {
    console.error('PDF reader error:', err);
    status.innerHTML = '<span style="color:#dc2626">⚠ Não foi possível ler o documento. Preencha manualmente.</span>';
    input.value = '';
  }
}

function saveVolume(sc, idx, val) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p || !p.itens[idx]) return;
  p.itens[idx].volume = parseFloat(val) || 0;
  dbUpdate(p);
}

function saveAmostra(sc, idx, field, val) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p || !p.itens[idx]) return;
  p.itens[idx][field] = parseFloat(val) || 0;
  dbUpdate(p);
}

function confirmarExclusao(sc) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;
  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header"><div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700;color:#dc2626">Excluir Pedido</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">' + sc + '</div></div>'
    + '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>'
    + '<div style="background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);border-radius:10px;padding:16px;margin-bottom:20px">'
    + '<div style="font-size:14px">Excluir <strong>' + sc + '</strong>? Esta acao nao pode ser desfeita.</div></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end">'
    + '<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>'
    + '<button class="btn btn-danger" onclick="executarExclusao(\'' + sc + '\')">Confirmar</button></div>';
  document.getElementById('modal-overlay').classList.add('open');
}

async function executarExclusao(sc) {
  // Show loading state
  const confirmBtn = document.querySelector('.btn-danger');
  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = 'Excluindo...'; }

  const ok = await dbDelete(sc);
  if (ok) {
    pedidos = pedidos.filter(p => p.sc !== sc);
    closeModal();
    toast('✔ Pedido ' + sc + ' excluído com sucesso', 'success');
    renderPedidosTable();
    renderDashboard();
  } else {
    // Re-enable button so user can try again
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = 'Confirmar Exclusao'; }
    // toast already shown by dbDelete
  }
}

function openEditModal(sc) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;

  const mkOpts = (list, cur) => list.map(v => '<option value="'+v+'"'+(v===cur?' selected':'')+'>'+v+'</option>').join('');

  // Build HTML with empty value attributes — fill via JS after render
  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">'
    + '<div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700">Editar Pedido</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">'+sc+'</div></div>'
    + '<button class="modal-close" onclick="openModal(\'' + sc + '\')">&#x2715;</button></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Empresa</label>'
    + '<select id="ed-empresa" style="width:100%"><option value="">Selecione...</option>'+mkOpts(['Kovalent', 'Biosys', 'Biosys Filial'], p.empresa)+'</select></div>'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Solicitante</label>'
    + '<input type="text" id="ed-solicitante" style="width:100%"></div>'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Departamento</label>'
    + '<select id="ed-depto" style="width:100%"><option value="">Selecione...</option>'+mkOpts(['Logística', 'TI', 'Envase e Montagem', 'Fabricação', 'Assessoria Científica', 'Assistência Técnica', 'Marketing', 'Projetos', 'Diretoria', 'Financeiro', 'Comercial', 'Faturamento', 'Gerência', 'Regulatório', 'Garantia da Qualidade', 'Controle de Qualidade', 'RH'], p.departamento)+'</select></div>'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Prioridade</label>'
    + '<select id="ed-prioridade" style="width:100%">'+mkOpts(['Baixa', 'Média', 'Alta', 'Urgente'], p.prioridade)+'</select></div>'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Tipo de Compra</label>'
    + '<select id="ed-tipo" style="width:100%"><option value="">Selecione...</option>'+mkOpts(['Uso/Consumo', 'Revenda', 'Licitações', 'Fabricação', 'Industrialização'], p.tipo)+'</select></div>'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Data Necessidade</label>'
    + '<input type="date" id="ed-necessidade" style="width:100%"></div>'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Fornecedor / Marca</label>'
    + '<input type="text" id="ed-fornecedor" style="width:100%"></div>'
    + '<div><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Valor Referencia (R$)</label>'
    + '<input type="number" id="ed-valref" step="0.01" min="0" style="width:100%"></div>'
    + '</div>'
    + '<div style="margin-bottom:14px"><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Link do Produto</label>'
    + '<input type="url" id="ed-link" style="width:100%" placeholder="https://..."></div>'
    + '<div style="margin-bottom:14px"><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Justificativa</label>'
    + '<textarea id="ed-justificativa" style="width:100%;min-height:70px"></textarea></div>'
    + '<div style="margin-bottom:20px"><label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;display:block;margin-bottom:5px">Observacoes</label>'
    + '<textarea id="ed-obs" style="width:100%;min-height:60px"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end">'
    + '<button class="btn btn-secondary" onclick="openModal(\'' + sc + '\')">Cancelar</button>'
    + '<button class="btn btn-primary" onclick="salvarEdicao(\'' + sc + '\')">Salvar</button></div>';

  document.getElementById('modal-overlay').classList.add('open');

  // Fill text/number/date/textarea fields via JS after render (avoids HTML escaping issues)
  document.getElementById('ed-solicitante').value   = p.solicitante   || '';
  document.getElementById('ed-necessidade').value   = p.necessidade   || '';
  document.getElementById('ed-fornecedor').value    = p.fornecedorSug || p.fornecedorEsc || '';
  document.getElementById('ed-valref').value        = p.valorRef      || '';
  document.getElementById('ed-link').value          = p.linkProduto   || '';
  document.getElementById('ed-justificativa').value = p.justificativa || '';
  document.getElementById('ed-obs').value           = p.obs           || '';
}

async function salvarEdicao(sc) {
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;
  p.empresa       = document.getElementById('ed-empresa')?.value       || p.empresa;
  p.solicitante   = document.getElementById('ed-solicitante')?.value   || p.solicitante;
  p.departamento  = document.getElementById('ed-depto')?.value         || p.departamento;
  p.prioridade    = document.getElementById('ed-prioridade')?.value    || p.prioridade;
  p.tipo          = document.getElementById('ed-tipo')?.value          || p.tipo;
  p.necessidade   = document.getElementById('ed-necessidade')?.value   || p.necessidade;
  p.fornecedorSug = document.getElementById('ed-fornecedor')?.value    || '';
  p.valorRef      = parseFloat(document.getElementById('ed-valref')?.value)||0;
  p.linkProduto   = document.getElementById('ed-link')?.value          || '';
  p.justificativa = document.getElementById('ed-justificativa')?.value || '';
  p.obs           = document.getElementById('ed-obs')?.value           || '';
  await dbUpdate(p);
  toast('Pedido ' + sc + ' atualizado!', 'success');
  openModal(sc);
}


function openLancamentoDireto() {
  document.getElementById('ld-overlay').style.display = 'flex';
  document.getElementById('ld-form').style.display = 'none';
  document.getElementById('ld-data').value = new Date().toISOString().split('T')[0];
  window._ldTipo = null;
  ['reposicao','programada'].forEach(t => {
    const b = document.getElementById('ld-btn-'+t);
    b.style.borderColor = '#d1dbe8'; b.style.background = '#f0f4f8';
  });
  ['ld-empresa','ld-depto','ld-tipo','ld-motivo','ld-periodicidade'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  const ldPrev = document.getElementById('ld-previsao'); if(ldPrev) ldPrev.value='';
  const ldProx = document.getElementById('ld-proxima'); if(ldProx) ldProx.value='';
  ['ld-descricao','ld-fornecedor','ld-obs'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('ld-valor').value = '';
  document.getElementById('ld-items-body').innerHTML = '';
  ldItemCount = 0;
  addLDItemRow();
  const pdfStatus = document.getElementById('pdf-status');
  if (pdfStatus) { pdfStatus.style.display='none'; pdfStatus.innerHTML=''; }
  const pdfInput = document.getElementById('pdf-upload');
  if (pdfInput) pdfInput.value = '';
}

function closeLancamentoDireto() {
  document.getElementById('ld-overlay').style.display = 'none';
}

function selectLDTipo(tipo) {
  window._ldTipo = tipo;
  const colors = { reposicao:'#00a99d', programada:'#7c3aed' };
  const bgs = { reposicao:'rgba(0,169,157,0.08)', programada:'rgba(124,58,237,0.08)' };
  ['reposicao','programada'].forEach(t => {
    const b = document.getElementById('ld-btn-'+t);
    b.style.borderColor = t===tipo ? colors[t] : '#d1dbe8';
    b.style.background  = t===tipo ? bgs[t]    : '#f0f4f8';
  });
  document.getElementById('ld-form').style.display = 'block';
  document.getElementById('ld-extra-reposicao').style.display  = tipo==='reposicao'  ? 'block' : 'none';
  document.getElementById('ld-extra-programada').style.display = tipo==='programada' ? 'block' : 'none';
}

function submitLancamentoDireto() {
  const tipo = window._ldTipo;
  if (!tipo) { toast('Selecione o tipo de lancamento', 'error'); return; }
  const empresa   = document.getElementById('ld-empresa').value;
  const depto     = document.getElementById('ld-depto').value;
  const ldItems = getLDItems();
  if (!empresa || !depto || ldItems.length === 0) { toast('Preencha Empresa, Departamento e adicione ao menos um item', 'error'); return; }
  const y  = new Date().getFullYear();
  const sc = 'SC-'+y+'-'+String(scCounter).padStart(3,'0');
  scCounter++; localStorage.setItem('kv_sc', scCounter);
  const valorPago = parseFloat(document.getElementById('ld-valor').value)||0;
  const novoPedido = {
    sc, origem: tipo, empresa, data: document.getElementById('ld-data').value,
    solicitante:'Comprador', departamento: depto,
    prioridade: tipo==='reposicao' ? 'Alta' : 'Media',
    necessidade: document.getElementById('ld-data').value,
    tipo: document.getElementById('ld-tipo').value,
    itens: ldItems,
    fornecedorSug: document.getElementById('ld-fornecedor').value,
    valorPago, valorCotacao: valorPago,
    justificativa: tipo==='reposicao'
      ? 'Reposicao de estoque - '+(document.getElementById('ld-motivo').value||'analise semanal')
      : 'Compra programada - '+(document.getElementById('ld-periodicidade').value||''),
    obs: document.getElementById('ld-obs').value,
    status: tipo==='programada' ? 'Finalizado' : 'Pedido de Compra',
    docPC:'', docFatura:'', docNFE:'',
    periodicidade: document.getElementById('ld-periodicidade').value||'',
    proximaCompra: document.getElementById('ld-proxima').value||'',
    previsaoEntrega: document.getElementById('ld-previsao')?.value||'',
    motivoReposicao: document.getElementById('ld-motivo').value||'',
    dataCriacao: new Date().toISOString(),
    dataFinalizado: tipo==='programada' ? new Date().toISOString().split('T')[0] : '',
    dataRecebimento: tipo==='programada' ? '' : '',
  };
  pedidos.unshift(novoPedido);
  dbInsert(novoPedido);
  closeLancamentoDireto();
  toast('Lancamento '+sc+' registrado!', 'success');
}

// =========================================================
// MODO ALMOXARIFE
// =========================================================
window.almoxarifeMode = false;
const ALMOXARIFE_PASSWORD = 'Almoxarife@123'; // ← altere aqui
const ALMOX_STATUSES = ['Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado'];

function toggleModoAlmoxarife() {
  if (!window.almoxarifeMode) {
    document.getElementById('alm-pwd-input').value = '';
    document.getElementById('alm-pwd-error').textContent = '';
    document.getElementById('alm-pwd-overlay').style.display = 'flex';
    setTimeout(() => document.getElementById('alm-pwd-input').focus(), 100);
  } else {
    window.almoxarifeMode = false;
    const btn = document.getElementById('btn-modo-almoxarife');
    btn.style.background = 'transparent';
    btn.style.color = '#7c3aed';
    btn.style.borderColor = '#7c3aed';
    document.getElementById('alm-icon').textContent = '📦';
    document.getElementById('alm-label').textContent = 'Modo Almoxarife';
    // restore KPI compras button
    const btnKpiC2 = document.getElementById('btn-kpi-compras');
    if (btnKpiC2) btnKpiC2.style.display = '';
    // re-lock painel if comprador is not active
    if (!window.compradorMode) {
      const painelBtn2 = document.getElementById('nav-painel');
      if (painelBtn2) {
        painelBtn2.classList.add('locked');
        painelBtn2.setAttribute('onclick', "requireComprador('painel')");
        const lockSpan2 = painelBtn2.querySelector('.lock-icon');
        if (lockSpan2) lockSpan2.textContent = '🔒';
      }
      // if currently on painel, go back to solicitar
      const activePane = document.querySelector('.tab-pane.active');
      if (activePane && activePane.id === 'tab-painel') switchTabDirect('solicitar');
    }
    toast('Modo Almoxarife desativado', 'success');
  }
}

function closeAlmPwdModal() {
  document.getElementById('alm-pwd-overlay').style.display = 'none';
}

function checkAlmoxarifePassword() {
  const val = document.getElementById('alm-pwd-input').value;
  if (val === ALMOXARIFE_PASSWORD) {
    closeAlmPwdModal();
    window.almoxarifeMode = true;
    const btn = document.getElementById('btn-modo-almoxarife');
    btn.style.background = 'linear-gradient(135deg,#7c3aed,#9333ea)';
    btn.style.color = '#fff';
    btn.style.borderColor = '#7c3aed';
    document.getElementById('alm-icon').textContent = '🔓';
    document.getElementById('alm-label').textContent = 'Almoxarife Ativo';
    // visually unlock painel button for almoxarife
    const painelBtn = document.getElementById('nav-painel');
    if (painelBtn) {
      painelBtn.classList.remove('locked');
      painelBtn.setAttribute('onclick', "requireComprador('painel')");
      const lockSpan = painelBtn.querySelector('.lock-icon');
      if (lockSpan) lockSpan.textContent = '';
    }
    toast('✔ Modo Almoxarife ativado', 'success');
  } else {
    document.getElementById('alm-pwd-error').textContent = 'Senha incorreta. Tente novamente.';
    document.getElementById('alm-pwd-input').value = '';
    document.getElementById('alm-pwd-input').style.borderColor = '#dc2626';
    setTimeout(() => document.getElementById('alm-pwd-input').style.borderColor = '#d1dbe8', 1200);
  }
}

// seed demo data
// Dados carregados do Supabase via dbLoad()


// =========================================================
// v1.1 — RECEBIMENTO PARCIAL E MULTIPLAS NFs POR ITEM
// =========================================================
(function initV11RecebimentoParcial(){
  try {
    if (typeof ALMOX_STATUSES !== 'undefined' && Array.isArray(ALMOX_STATUSES) && !ALMOX_STATUSES.includes('Recebimento Parcial')) {
      const idx = ALMOX_STATUSES.indexOf('Lançar NF');
      ALMOX_STATUSES.splice(idx >= 0 ? idx : 0, 0, 'Recebimento Parcial');
    }
  } catch(e) {}

  document.addEventListener('DOMContentLoaded', () => {
    addRecebimentoParcialFilters();
  });
})();

function escapeHTML(v) {
  return String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function parseQtd(v) {
  if (v === null || v === undefined || v === '') return 0;
  return parseFloat(String(v).replace(',', '.')) || 0;
}

function getItemQtd(item) {
  return parseQtd(item.qtd ?? item.quantidade ?? item.qtdSolicitada);
}

function getItemRecebido(item) {
  if (Array.isArray(item.recebimentos) && item.recebimentos.length) {
    return item.recebimentos.reduce((s, r) => s + parseQtd(r.qtd ?? r.quantidade), 0);
  }
  return parseQtd(item.qtdRecebida ?? item.quantidadeRecebida ?? 0);
}

function getItemSaldo(item) {
  return Math.max(0, getItemQtd(item) - getItemRecebido(item));
}

function getItemStatus(item) {
  const qtd = getItemQtd(item);
  const recebido = getItemRecebido(item);
  if (item.statusItem === 'Cancelado') return 'Cancelado';
  if (qtd > 0 && recebido >= qtd) return 'Recebido';
  if (recebido > 0) return 'Parcial';
  return item.statusItem || 'Pendente';
}

function normalizeItem(item) {
  item = item || {};
  if (!Array.isArray(item.recebimentos)) item.recebimentos = [];
  item.qtdRecebida = getItemRecebido(item);
  item.statusItem = getItemStatus(item);
  return item;
}

function normalizePedidoItems(p) {
  if (!p) return p;
  if (!Array.isArray(p.itens)) p.itens = [];
  p.itens = p.itens.map(normalizeItem);
  return p;
}

function pedidoTemRecebimento(p) {
  return (p.itens || []).some(i => getItemRecebido(i) > 0);
}

function pedidoRecebidoTotal(p){
  const itens = Array.isArray(p && p.itens) ? p.itens : [];
  return itens.length > 0 && itens.every(it => Number(it.qtdRecebida || 0) >= Number(it.qtd || it.quantidade || 0));
}


function pedidoTodosItensRecebidos(p) {
  const validos = (p.itens || []).filter(i => getItemQtd(i) > 0 && getItemStatus(i) !== 'Cancelado');
  return validos.length > 0 && validos.every(i => getItemRecebido(i) >= getItemQtd(i));
}

function getPedidoNFs(p) {
  const map = new Map();
  (p.itens || []).forEach((item, idx) => {
    (item.recebimentos || []).forEach(r => {
      const nf = (r.nf || r.numeroNF || '').trim();
      if (!nf) return;
      if (!map.has(nf)) map.set(nf, { nf, data: r.data || '', recebidoPor: r.recebidoPor || '', itens: [] });
      map.get(nf).itens.push({ idx, descricao: item.descricao || 'Item', qtd: parseQtd(r.qtd ?? r.quantidade), unidade: item.unidade || 'Un' });
      if (!map.get(nf).data && r.data) map.get(nf).data = r.data;
      if (!map.get(nf).recebidoPor && r.recebidoPor) map.get(nf).recebidoPor = r.recebidoPor;
    });
  });
  return [...map.values()];
}

function recalcPedidoRecebimento(p) {
  normalizePedidoItems(p);
  const nfs = getPedidoNFs(p).map(x => x.nf);
  p.docNFE = nfs.join(', ');
  if (pedidoTemRecebimento(p) && !p.dataLancarNF) p.dataLancarNF = new Date().toISOString().split('T')[0];
  if (pedidoTodosItensRecebidos(p)) {
    if (['A Caminho','Recebimento Parcial'].includes(p.status)) p.status = 'Lançar NF';
  } else if (pedidoTemRecebimento(p)) {
    if (!['Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado','Cancelado'].includes(p.status)) {
      p.status = 'Recebimento Parcial';
    }
  }
  return p;
}

function statusItemBadge(status) {
  const colors = {
    'Pendente': 'background:rgba(107,125,153,0.14);color:#6b7f96',
    'Parcial': 'background:rgba(217,119,6,0.14);color:#d97706',
    'Recebido': 'background:rgba(5,150,105,0.14);color:#059669',
    'Cancelado': 'background:rgba(220,38,38,0.12);color:#dc2626'
  };
  return '<span style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;white-space:nowrap;'+(colors[status]||colors.Pendente)+'">'+escapeHTML(status)+'</span>';
}

function formatQty(v) {
  const n = parseQtd(v);
  return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function addRecebimentoParcialFilters() {
  const addBtn = (groupId, fn) => {
    const group = document.getElementById(groupId);
    if (!group || group.querySelector('[data-status="Recebimento Parcial"]')) return;
    const ref = group.querySelector('[data-status="Lançar NF"]');
    const btn = document.createElement('button');
    btn.className = 'status-filter-btn';
    btn.dataset.status = 'Recebimento Parcial';
    btn.textContent = 'Receb. Parcial';
    btn.setAttribute('onclick', fn+'(this)');
    group.insertBefore(btn, ref || null);
  };
  addBtn('status-filter-group', 'toggleStatusFilter');
  addBtn('prog-status-filter-group', 'toggleProgStatusFilter');
}

// override mapper to normalize legacy rows
function fromDB(r) {
  return normalizePedidoItems({
    sc: r.sc, origem: r.origem, empresa: r.empresa,
    data: r.data, solicitante: r.solicitante,
    departamento: r.departamento, prioridade: r.prioridade,
    necessidade: r.necessidade, tipo: r.tipo,
    itens: r.itens||[], fornecedorSug: r.fornecedor_sug,
    fornecedorEsc: r.fornecedor_esc,
    valorRef: r.valor_ref, valorCotacao: r.valor_cotacao,
    valorPago: r.valor_pago, saving: r.valor_saving,
    savingRef: r.valor_saving_ref, linkProduto: r.link_produto,
    justificativa: r.justificativa, aprovador: r.aprovador,
    obs: r.obs, status: r.status,
    docPC: r.doc_pc, docFatura: r.doc_fatura, docNFE: r.doc_nfe,
    rastreio: r.rastreio, previsaoEntrega: r.previsao_entrega,
    periodicidade: r.periodicidade, proximaCompra: r.proxima_compra,
    motivoReposicao: r.motivo_reposicao,
    dataCotacao: r.data_cotacao, dataPedidoCompra: r.data_pedido_compra,
    dataAguardando: r.data_aguardando, dataACaminho: r.data_acaminho,
    dataLancarNF: r.data_lancar_nf, dataRecebimento: r.data_recebimento,
    dataConferencia: r.data_conferencia, dataAguardandoId: r.data_aguardando_id,
    dataAmostragem: r.data_amostragem, dataAguardandoRet: r.data_aguardando_ret,
    dataFinalizado: r.data_finalizado, dataCancelado: r.data_cancelado,
    recebidoPor: r.recebido_por,
  });
}

function toDB(p) {
  normalizePedidoItems(p);
  return {
    sc: p.sc, origem: p.origem||null, empresa: p.empresa||null,
    data: p.data||null, solicitante: p.solicitante||null,
    departamento: p.departamento||null, prioridade: p.prioridade||null,
    necessidade: p.necessidade||null, tipo: p.tipo||null,
    itens: p.itens||[], fornecedor_sug: p.fornecedorSug||null,
    fornecedor_esc: p.fornecedorEsc||null,
    valor_ref: p.valorRef||null, valor_cotacao: p.valorCotacao||null,
    valor_pago: p.valorPago||null, valor_saving: p.saving||null,
    valor_saving_ref: p.savingRef||null, link_produto: p.linkProduto||null,
    justificativa: p.justificativa||null, aprovador: p.aprovador||null,
    obs: p.obs||null, status: p.status||'Solicitado',
    doc_pc: p.docPC||null, doc_fatura: p.docFatura||null, doc_nfe: p.docNFE||null,
    rastreio: p.rastreio||null, previsao_entrega: p.previsaoEntrega||null,
    periodicidade: p.periodicidade||null, proxima_compra: p.proximaCompra||null,
    motivo_reposicao: p.motivoReposicao||null,
    data_cotacao: p.dataCotacao||null, data_pedido_compra: p.dataPedidoCompra||null,
    data_aguardando: p.dataAguardando||null, data_acaminho: p.dataACaminho||null,
    data_lancar_nf: p.dataLancarNF||null, data_recebimento: p.dataRecebimento||null,
    data_conferencia: p.dataConferencia||null, data_aguardando_id: p.dataAguardandoId||null,
    data_amostragem: p.dataAmostragem||null, data_aguardando_ret: p.dataAguardandoRet||null,
    data_finalizado: p.dataFinalizado||null, data_cancelado: p.dataCancelado||null,
    recebido_por: p.recebidoPor||null,
  };
}

function buildItemRecebimentoResumo(item) {
  const recs = item.recebimentos || [];
  if (!recs.length) return '<span style="color:var(--muted);font-size:12px">—</span>';
  return recs.map(r => '<div style="font-size:12px;color:var(--muted);margin-bottom:2px"><strong style="color:var(--accent2)">NF '+escapeHTML(r.nf||'—')+'</strong> · '+formatQty(r.qtd)+' '+escapeHTML(item.unidade||'')+(r.data?' · '+formatDate(r.data):'')+'</div>').join('');
}

function buildHistoricoRecebimentos(p) {
  const nfs = getPedidoNFs(p);
  if (!nfs.length) return '';
  return '<div class="card-title" style="margin-top:22px"><span>🧾</span> Histórico de Recebimentos / NFs</div>'
    + '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">'
    + nfs.map(n => '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:14px">'
      + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px">'
      + '<strong style="color:var(--accent2)">NF '+escapeHTML(n.nf)+'</strong>'
      + '<span style="font-size:12px;color:var(--muted)">'+(n.data?formatDate(n.data):'Sem data')+(n.recebidoPor?' · '+escapeHTML(n.recebidoPor):'')+'</span></div>'
      + n.itens.map(it => '<div style="font-size:13px;margin-top:4px">✓ '+escapeHTML(it.descricao)+' — '+formatQty(it.qtd)+' '+escapeHTML(it.unidade)+'</div>').join('')
      + '</div>').join('')
    + '</div>';
}

function openModal(sc) {
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;

  const steps = [
    { label:'Solicitado', icon:'📋', status:'done', date: formatDate(p.data), note: `Por ${p.solicitante||'—'}` },
    { label:'Cotação', icon:'💬', status: stepStatus(p.status, 'Cotação'), date: p.dataCotacao||'', note: p.valorCotacao ? `R$ ${Number(p.valorCotacao).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '' },
    { label:'Pedido de Compra', icon:'📝', status: stepStatus(p.status, 'Pedido de Compra'), date: p.dataPedidoCompra||'', note: p.docPC ? `PC: ${p.docPC}` : '' },
    { label:'Aguardando Pagamento', icon:'💳', status: stepStatus(p.status, 'Aguardando Pagamento'), date: p.dataAguardando||'', note: p.docFatura ? `Fat.: ${p.docFatura}` : '' },
    { label:'A Caminho', icon:'🚚', status: stepStatus(p.status, 'A Caminho'), date: p.dataACaminho||'', note: p.rastreio ? `Rastreio: ${p.rastreio}` : '' },
    { label:'Recebido', icon:'📦', status: stepStatus(p.status, 'Recebimento Parcial'), date: p.dataLancarNF ? formatDate(p.dataLancarNF) : '', note: pedidoTemRecebimento(p) ? (pedidoRecebidoTotal(p) ? 'Recebimento total registrado' : 'Recebimento parcial registrado') : '' },
    { label:'Lançar NF', icon:'🧾', status: stepStatus(p.status, 'Lançar NF'), date: p.dataLancarNF||'', note: p.docNFE ? `NF(s): ${p.docNFE}` : '' },
    { label:'Conferência', icon:'🔍', status: stepStatus(p.status, 'Conferência'), date: p.dataConferencia ? formatDate(p.dataConferencia) : '', note: '' },
    { label:'Aguardando Identificação', icon:'🏷️', status: stepStatus(p.status, 'Aguardando Identificação'), date: p.dataAguardandoId ? formatDate(p.dataAguardandoId) : '', note: '' },
    { label:'Amostragem', icon:'🧪', status: stepStatus(p.status, 'Amostragem'), date: p.dataAmostragem ? formatDate(p.dataAmostragem) : '', note: '' },
    { label:'Aguardando Retirada do Estoque', icon:'📤', status: stepStatus(p.status, 'Aguardando Retirada do Estoque'), date: p.dataAguardandoRet ? formatDate(p.dataAguardandoRet) : '', note: '' },
    { label:'Finalizado', icon:'✅', status: stepStatus(p.status, 'Finalizado'), date: p.dataFinalizado||'', note: (p.dataFinalizado && getFinalizadoPor(p)) ? `Por: ${getFinalizadoPor(p)}` : '' },
  ];
  const tlHtml = steps.map((s,i) => '<div class="tl-step"><div class="tl-icon-col"><div class="tl-dot '+s.status+'">'+s.icon+'</div>'+(i < steps.length-1 ? '<div class="tl-line"></div>' : '')+'</div><div class="tl-content"><div class="tl-label">'+s.label+'</div>'+(s.date ? '<div class="tl-date">'+s.date+'</div>' : '')+(s.note ? '<div class="tl-note">'+s.note+'</div>' : '')+'</div></div>').join('');

  const canAlmox = window.almoxarifeMode && p && (typeof ALMOX_STATUSES !== 'undefined') && ALMOX_STATUSES.includes(p.status);
  const canEdit  = window.compradorMode || canAlmox;
  const canReceber = window.compradorMode || canAlmox;

  const itensHtml = (p.itens||[]).map((item, idx) => {
    const status = getItemStatus(item);
    const saldo = getItemSaldo(item);
    const recBtn = (canReceber && saldo > 0)
      ? '<button class="btn btn-secondary" style="padding:6px 10px;font-size:12px" onclick="openRecebimentoModal(\''+p.sc+'\','+idx+')">📦 Receber</button>'
      : '<span style="font-size:12px;color:#059669;font-weight:600">Concluído</span>';
    return '<tr>'
      + '<td style="padding:8px">'+escapeHTML(item.descricao||'—')+'</td>'
      + '<td style="padding:8px;text-align:center">'+formatQty(getItemQtd(item))+'</td>'
      + '<td style="padding:8px;text-align:center">'+formatQty(getItemRecebido(item))+'</td>'
      + '<td style="padding:8px;text-align:center">'+formatQty(saldo)+'</td>'
      + '<td style="padding:8px">'+escapeHTML(item.unidade||'—')+'</td>'
      + '<td style="padding:8px">'+escapeHTML(item.ref||'—')+'</td>'
      + '<td style="padding:8px">'+statusItemBadge(status)+'</td>'
      + '<td style="padding:8px;min-width:130px">'+buildItemRecebimentoResumo(item)+'</td>'
      + '<td style="padding:8px">'+recBtn+'</td>'
      + '</tr>';
  }).join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div>
        <div style="font-family:'Inter',sans-serif; font-size:22px; font-weight:700">${escapeHTML(p.sc)}</div>
        <div style="color:var(--muted); font-size:13px; margin-top:4px">${escapeHTML(p.solicitante||'—')} · ${escapeHTML(p.departamento||'—')}</div>
      </div>
      <div style="display:flex; align-items:center; gap:12px">
        <span class="status-badge status-${statusKey(p.status)}">${escapeHTML(p.status)}</span>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:20px">
      <div style="background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:4px">PRIORIDADE</div><div class="priority-${String(p.prioridade||'baixa').toLowerCase()}" style="font-weight:600">${escapeHTML(p.prioridade||'—')}</div></div>
      <div style="background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:4px">NECESSIDADE</div><div>${formatDate(p.necessidade)}</div></div>
      <div style="background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:4px">TIPO</div><div>${escapeHTML(p.tipo||'—')}</div></div>
    </div>
    ${p.linkProduto ? `<div style="margin-bottom:16px; background:var(--surface2); border-radius:10px; padding:14px; display:flex; align-items:center; gap:10px"><div style="font-size:11px; color:var(--muted); margin-right:4px">🔗 LINK:</div><a href="${escapeHTML(p.linkProduto)}" target="_blank" style="color:var(--accent); font-size:13px; word-break:break-all">${escapeHTML(p.linkProduto)}</a></div>` : ''}

    <div class="card-title"><span>📦</span> Itens da Solicitação</div>
    <div class="data-table-wrap" style="margin-bottom:18px">
      <table style="width:100%; font-size:13px">
        <thead><tr style="border-bottom:1px solid var(--border)">
          <th>Descrição</th><th>Qtd.</th><th>Recebido</th><th>Saldo</th><th>Un.</th><th>Ref.</th><th>Status Item</th><th>NF(s)</th><th></th>
        </tr></thead>
        <tbody>${itensHtml}</tbody>
      </table>
    </div>

    ${buildHistoricoRecebimentos(p)}

    <div class="card-title"><span>🗺</span> Acompanhamento</div>
    <div class="timeline">${tlHtml}</div>

    ${p.justificativa ? `<div style="margin-top:20px; background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:6px">JUSTIFICATIVA</div><div style="font-size:13px">${escapeHTML(p.justificativa)}</div></div>` : ''}
    ${getObsPublica(p) ? `<div style="margin-top:12px; background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:6px">OBSERVAÇÕES</div><div style="font-size:13px">${escapeHTML(getObsPublica(p))}</div></div>` : ''}
  `;

  document.getElementById('modal-content').innerHTML +=
    '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">'
    + (canEdit ? '<button class="btn btn-secondary" onclick="updateStatus(\'' + p.sc + '\')">🔄 Atualizar Status</button>' : window.almoxarifeMode ? '<span style="font-size:12px;color:#a855f7;display:flex;align-items:center;gap:6px">📦 Almoxarife só pode atualizar a partir de Lançar NF</span>' : '<span style="font-size:12px;color:#6b7f96;display:flex;align-items:center;gap:6px">🔒 Apenas compradores podem atualizar o status</span>')
    + (canEdit ? '<button class="btn btn-secondary" onclick="openStatusInfoEditor(\'' + p.sc + '\')">✏️ Editar/Apagar Etapas</button>' : '')
    + (canReceber ? '<button class="btn btn-primary" onclick="openRecebimentoModal(\'' + p.sc + '\')">📦 Registrar Recebimento</button>' : '')
    + (window.compradorMode ? '<button class="btn btn-secondary" onclick="openEditModal(\'' + p.sc + '\')">Editar</button>' : '')
    + (window.compradorMode ? '<button class="btn btn-danger" onclick="confirmarExclusao(\'' + p.sc + '\')">Excluir</button>' : '')
    + '<button class="btn btn-secondary" onclick="closeModal()">Fechar</button>'
    + '</div>';
  document.getElementById('modal-overlay').classList.add('open');
}

function setRecebimentoTipo(tipo) {
  document.querySelectorAll('[data-rec-tipo]').forEach(btn => {
    const ativo = btn.dataset.recTipo === tipo;
    btn.className = ativo ? 'btn btn-primary' : 'btn btn-secondary';
  });
  document.getElementById('rec-tipo').value = tipo;
  document.querySelectorAll('.rec-qtd').forEach(inp => {
    if (tipo === 'total') inp.value = inp.max || '';
    else inp.value = '';
    inp.readOnly = tipo === 'total';
  });
}

function openRecebimentoModal(sc, onlyIdx) {
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;
  const today = new Date().toISOString().split('T')[0];
  const itens = (p.itens || []).map((item, idx) => ({ item, idx, saldo: getItemSaldo(item) })).filter(x => x.saldo > 0 && (onlyIdx === undefined || onlyIdx === x.idx));
  if (!itens.length) { toast('Todos os itens já foram recebidos.', 'success'); return; }

  const rows = itens.map(({item, idx, saldo}) => '<tr>'
    + '<td style="padding:8px">'+escapeHTML(item.descricao||'—')+'<div style="font-size:11px;color:var(--muted)">Saldo: '+formatQty(saldo)+' '+escapeHTML(item.unidade||'')+'</div></td>'
    + '<td style="padding:8px;text-align:center">'+formatQty(getItemQtd(item))+'</td>'
    + '<td style="padding:8px;text-align:center">'+formatQty(getItemRecebido(item))+'</td>'
    + '<td style="padding:8px"><input type="number" class="rec-qtd" data-idx="'+idx+'" min="0" max="'+saldo+'" step="0.01" placeholder="0" style="width:100px"></td>'
    + '</tr>').join('');

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header"><div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700">📦 Registrar Recebimento</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">'+escapeHTML(sc)+' · registre recebimento total ou parcial</div></div>'
    + '<button class="modal-close" onclick="openModal(\''+sc+'\')">✕</button></div>'
    + '<input type="hidden" id="rec-tipo" value="parcial">'
    + '<div style="display:flex;gap:8px;margin-bottom:16px"><button type="button" class="btn btn-secondary" data-rec-tipo="parcial" onclick="setRecebimentoTipo(\'parcial\')">📦 Recebimento Parcial</button><button type="button" class="btn btn-secondary" data-rec-tipo="total" onclick="setRecebimentoTipo(\'total\')">✅ Recebimento Total</button></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">'
    + '<div><label>NF de Entrada *</label><input id="rec-nf" type="text" placeholder="Ex: 123456" style="width:100%"></div>'
    + '<div><label>Quantidade de Volumes Recebidos *</label><input id="rec-volumes" type="number" min="1" step="1" placeholder="Ex: 4" style="width:100%"></div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
    + '<div><label>Data de Recebimento *</label><input id="rec-data" type="date" value="'+today+'" style="width:100%"></div>'
    + '<div><label>Recebido por *</label><input id="rec-por" type="text" placeholder="Nome de quem recebeu" style="width:100%"></div>'
    + '</div>'
    + '<div class="data-table-wrap" style="margin-bottom:16px"><table style="width:100%;font-size:13px"><thead><tr><th>Item</th><th>Qtd.</th><th>Já Recebido</th><th>Receber agora</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    + '<div style="margin-bottom:16px"><label>Observação</label><textarea id="rec-obs" placeholder="Opcional" style="width:100%;min-height:60px"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-secondary" onclick="openModal(\''+sc+'\')">Cancelar</button><button class="btn btn-primary" onclick="confirmRecebimento(\''+sc+'\')">Salvar Recebimento</button></div>';
  document.getElementById('modal-overlay').classList.add('open');
  setRecebimentoTipo('parcial');
}

async function confirmRecebimento(sc) {
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;
  const nf = document.getElementById('rec-nf')?.value?.trim();
  const data = document.getElementById('rec-data')?.value;
  const recebidoPor = document.getElementById('rec-por')?.value?.trim();
  const obs = document.getElementById('rec-obs')?.value?.trim();
  const volumes = parseQtd(document.getElementById('rec-volumes')?.value);
  const tipo = document.getElementById('rec-tipo')?.value || 'parcial';
  if (!nf) { toast('Informe o número da NF de entrada.', 'error'); return; }
  if (!volumes || volumes <= 0) { toast('Informe a quantidade de volumes recebidos.', 'error'); return; }
  if (!data) { toast('Informe a data de recebimento.', 'error'); return; }
  if (!recebidoPor) { toast('Informe o nome de quem recebeu.', 'error'); return; }

  let totalLinhas = 0;
  let erroQtd = '';
  const inputsValidos = [...document.querySelectorAll('.rec-qtd')].filter(inp => parseQtd(inp.value) > 0);
  document.querySelectorAll('.rec-qtd').forEach(inp => {
    const idx = parseInt(inp.dataset.idx, 10);
    const qtd = parseQtd(inp.value);
    if (!qtd || qtd <= 0) return;
    const item = p.itens[idx];
    const saldo = getItemSaldo(item);
    if (qtd > saldo) {
      inp.style.borderColor = '#dc2626';
      erroQtd = 'Quantidade recebida maior que o saldo do item: ' + (item.descricao || 'Item');
      return;
    }
    item.recebimentos = item.recebimentos || [];
    // Volumes pertencem ao recebimento/NF. Para não duplicar em vários itens, ficam na primeira linha recebida.
    const volRegistro = totalLinhas === 0 ? volumes : 0;
    item.recebimentos.push({ nf, data, qtd, volumes: volRegistro, tipo, recebidoPor, obs, criadoEm: new Date().toISOString() });
    normalizeItem(item);
    totalLinhas++;
  });
  if (erroQtd) { toast(erroQtd, 'error'); return; }
  if (!totalLinhas) { toast('Informe quantidade recebida para ao menos um item.', 'error'); return; }

  // Recalcula volumes a partir do histórico para manter o KPI correto inclusive em recebimentos parciais sucessivos.
  p.itens.forEach(item => {
    item.volume = (item.recebimentos || []).reduce((s,r) => s + parseQtd(r.volumes), 0);
  });
  recalcPedidoRecebimento(p);
  p.dataRecebimento = data;
  p.dataLancarNF = data;
  p.recebidoPor = recebidoPor;
  p.status = 'Lançar NF';
  if (obs) p.obs = (p.obs ? p.obs + ' | ' : '') + '[Recebimento NF '+nf+'] ' + obs;

  await dbUpdate(p);
  toast((tipo === 'total' ? 'Recebimento total' : 'Recebimento parcial') + ' registrado. Pedido avançado para Lançar NF.', 'success');
  openModal(sc);
  renderPedidosTable();
  renderDashboard();
  try { renderRecebimentosCentral(); } catch(e) {}
  try { renderKPIAlmox(); } catch(e) {}
}

function statusKey(s) {
  const map = { 'Solicitado':'solicitado', 'Cotação':'cotacao', 'Pedido de Compra':'pedidocompra', 'Aguardando Pagamento':'aguardando', 'A Caminho':'acaminho', 'Recebimento Parcial':'recebimentoparcial', 'Lançar NF':'lancarnf', 'Conferência':'conferencia', 'Aguardando Identificação':'aguardandoid', 'Amostragem':'amostragem', 'Aguardando Retirada do Estoque':'aguardandoretirada', 'Finalizado':'finalizado', 'Cancelado':'cancelado' };
  return map[s]||'solicitado';
}

function stepStatus(current, step) {
  const order = ['Solicitado','Cotação','Pedido de Compra','Aguardando Pagamento','A Caminho','Recebimento Parcial','Lançar NF','Conferência','Aguardando Identificação','Amostragem','Aguardando Retirada do Estoque','Finalizado'];
  const ci = order.indexOf(current);
  const si = order.indexOf(step);
  if (ci > si) return 'done';
  if (ci === si) return 'active';
  return 'pending';
}

function getLDItems() {
  const rows = document.querySelectorAll('#ld-items-body .item-row');
  const items = [];
  rows.forEach(r => {
    const inputs = r.querySelectorAll('input, select');
    const desc = inputs[0].value.trim();
    if (desc) items.push(normalizeItem({ descricao: desc, unidade: inputs[1].value, qtd: inputs[2].value||'1', ref: inputs[3].value, qtdRecebida: 0, statusItem: 'Pendente', recebimentos: [] }));
  });
  return items;
}

function submitSolicitacao() {
  const sc = document.getElementById('f-sc').value;
  const empresa = document.getElementById('f-empresa').value;
  const solicitante = document.getElementById('f-solicitante').value.trim();
  const depto = document.getElementById('f-depto').value;
  const prioridade = document.getElementById('f-prioridade').value;
  const necessidade = document.getElementById('f-necessidade').value;
  const justificativa = document.getElementById('f-justificativa').value.trim();

  const rows = document.querySelectorAll('#items-body .item-row');
  const items = [];
  rows.forEach(r => {
    const inputs = r.querySelectorAll('input, select');
    const desc = inputs[0].value.trim();
    if (desc) items.push(normalizeItem({ descricao: desc, unidade: inputs[1].value, qtd: inputs[2].value || '1', ref: inputs[3].value, qtdRecebida: 0, statusItem: 'Pendente', recebimentos: [] }));
  });

  if (!empresa || !solicitante || !depto || !prioridade || !necessidade || !justificativa) { toast('Preencha todos os campos obrigatórios (*)', 'error'); return; }
  if (items.length === 0) { toast('Adicione pelo menos um item à solicitação', 'error'); return; }

  const novoPedido = normalizePedidoItems({
    sc, empresa, data: document.getElementById('f-data').value, solicitante, departamento: depto, prioridade,
    necessidade, tipo: document.getElementById('f-tipo').value, itens: items,
    fornecedorSug: document.getElementById('f-fornecedor').value, linkProduto: document.getElementById('f-link').value,
    valorRef: parseFloat(document.getElementById('f-valref').value)||0, justificativa,
    aprovador: document.getElementById('f-aprovador').value, obs: document.getElementById('f-obs').value,
    status: 'Solicitado', dataCriacao: new Date().toISOString(), docNFE: ''
  });

  pedidos.unshift(novoPedido);
  scCounter++;
  localStorage.setItem('kv_sc', scCounter);
  dbInsert(novoPedido);
  toast(`✔ Solicitação ${sc} registrada com sucesso!`, 'success');
  clearForm();
  generateSC();
  addItemRow();
}


// =========================================================
// v1.1.2 — CENTRAL DE RECEBIMENTOS
// =========================================================
(function initV112CentralRecebimentos(){
  document.addEventListener('DOMContentLoaded', () => {
    try { addRecebimentosNavAccess(); } catch(e) {}
  });
})();

function addRecebimentosNavAccess() {
  const nav = document.getElementById('nav-recebimentos');
  if (!nav) return;
  if (window.almoxarifeMode || window.compradorMode) {
    nav.classList.remove('locked');
    const lock = nav.querySelector('.lock-icon');
    if (lock) lock.textContent = '';
  } else {
    nav.classList.add('locked');
    const lock = nav.querySelector('.lock-icon');
    if (lock) lock.textContent = '🔒';
  }
}

function requireAlmoxarife(tab) {
  if (window.almoxarifeMode || window.compradorMode) {
    switchTab(tab);
    return;
  }
  window._pendingAlmoxTab = tab;
  document.getElementById('alm-pwd-input').value = '';
  document.getElementById('alm-pwd-error').textContent = '';
  document.getElementById('alm-pwd-overlay').style.display = 'flex';
  setTimeout(() => document.getElementById('alm-pwd-input').focus(), 100);
}

// Wrap original mode functions so the Central is unlocked/locked visually.
if (typeof toggleModoAlmoxarife === 'function' && !window._v112_toggleAlmoxWrapped) {
  window._v112_toggleAlmoxWrapped = true;
  const _oldToggleAlmoxarife = toggleModoAlmoxarife;
  toggleModoAlmoxarife = function() {
    const r = _oldToggleAlmoxarife.apply(this, arguments);
    setTimeout(addRecebimentosNavAccess, 80);
    return r;
  };
}

if (typeof checkAlmoxarifePassword === 'function' && !window._v112_checkAlmoxWrapped) {
  window._v112_checkAlmoxWrapped = true;
  const _oldCheckAlmoxarifePassword = checkAlmoxarifePassword;
  checkAlmoxarifePassword = function() {
    const before = window.almoxarifeMode;
    const r = _oldCheckAlmoxarifePassword.apply(this, arguments);
    setTimeout(() => {
      addRecebimentosNavAccess();
      if (!before && window.almoxarifeMode && window._pendingAlmoxTab) {
        const tab = window._pendingAlmoxTab;
        window._pendingAlmoxTab = null;
        switchTab(tab);
      }
    }, 120);
    return r;
  };
}

if (typeof checkPassword === 'function' && !window._v112_checkCompradorWrapped) {
  window._v112_checkCompradorWrapped = true;
  const _oldCheckPassword = checkPassword;
  checkPassword = function() {
    const r = _oldCheckPassword.apply(this, arguments);
    setTimeout(addRecebimentosNavAccess, 120);
    return r;
  };
}

// Wrap switchTab to render the central automatically.
if (typeof switchTab === 'function' && !window._v112_switchWrapped) {
  window._v112_switchWrapped = true;
  const _oldSwitchTab = switchTab;
  switchTab = function(name) {
    const r = _oldSwitchTab.apply(this, arguments);
    if (name === 'recebimentos') renderRecebimentosCentral();
    return r;
  };
}

// Refresh Central after saving a receipt.
if (typeof confirmRecebimento === 'function' && !window._v112_confirmRecebimentoWrapped) {
  window._v112_confirmRecebimentoWrapped = true;
  const _oldConfirmRecebimento = confirmRecebimento;
  confirmRecebimento = async function(sc) {
    const r = await _oldConfirmRecebimento.apply(this, arguments);
    setTimeout(() => {
      const active = document.querySelector('.tab-pane.active');
      if (active && active.id === 'tab-recebimentos') renderRecebimentosCentral();
    }, 250);
    return r;
  };
}

function pedidoPodeReceber(p) {
  if (!p || !Array.isArray(p.itens)) return false;
  if (['Finalizado','Cancelado'].includes(p.status)) return false;
  return p.itens.some(i => getItemSaldo(i) > 0);
}

function pedidoRecebimentoSituacao(p) {
  normalizePedidoItems(p);
  const temRecebido = pedidoTemRecebimento(p);
  const todos = pedidoTodosItensRecebidos(p);
  if (todos) return 'concluido';
  if (temRecebido) return 'parcial';
  return 'pendente';
}

function recebimentoSituacaoBadge(s) {
  if (s === 'concluido') return '<span style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(5,150,105,.12);color:#059669">Total recebido</span>';
  if (s === 'parcial') return '<span style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(217,119,6,.13);color:#d97706">Parcial</span>';
  return '<span style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(107,127,150,.13);color:#6b7f96">Pendente</span>';
}

function renderRecebimentosCentral() {
  const table = document.getElementById('recebimentos-table');
  const hist = document.getElementById('recebimentos-historico');
  const kpis = document.getElementById('recebimentos-kpis');
  if (!table) return;

  const q = (document.getElementById('filterRecebimentos')?.value || '').toLowerCase().trim();
  const statusFiltro = document.getElementById('filterRecebimentosStatus')?.value || '';

  pedidos.forEach(normalizePedidoItems);

  const base = pedidos.filter(p => {
    if (!p || !Array.isArray(p.itens)) return false;
    if (['Cancelado'].includes(p.status)) return false;
    const situacao = pedidoRecebimentoSituacao(p);
    if (statusFiltro && situacao !== statusFiltro) return false;

    const nfs = getPedidoNFs(p).map(n => n.nf).join(' ');
    const hay = [
      p.sc, p.empresa, p.solicitante, p.departamento, p.fornecedorEsc, p.fornecedorSug, p.status, nfs,
      ...(p.itens || []).map(i => i.descricao + ' ' + (i.ref || ''))
    ].join(' ').toLowerCase();
    if (q && !hay.includes(q)) return false;

    return pedidoPodeReceber(p) || pedidoTemRecebimento(p);
  }).sort((a,b) => {
    const sa = pedidoRecebimentoSituacao(a);
    const sb = pedidoRecebimentoSituacao(b);
    const order = { parcial: 0, pendente: 1, concluido: 2 };
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    return (b.dataRecebimento || b.data || '').localeCompare(a.dataRecebimento || a.data || '');
  });

  const recebiveis = pedidos.filter(p => pedidoPodeReceber(normalizePedidoItems(p))).length;
  const parciais = pedidos.filter(p => pedidoRecebimentoSituacao(p) === 'parcial').length;
  const concluidos = pedidos.filter(p => pedidoRecebimentoSituacao(p) === 'concluido').length;
  const nfsMes = getTodosRecebimentos().filter(r => {
    if (!r.data) return false;
    const d = new Date(r.data);
    const h = new Date();
    return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
  }).length;

  if (kpis) {
    kpis.innerHTML =
      '<div class="kpi-card"><div class="kpi-label">📥 Pedidos Recebíveis</div><div class="kpi-value accent" style="font-size:26px">'+recebiveis+'</div><div class="kpi-sub">com saldo pendente</div></div>'
      + '<div class="kpi-card" style="border-color:rgba(217,119,6,.25)"><div class="kpi-label">🟡 Parciais</div><div class="kpi-value warn" style="font-size:26px">'+parciais+'</div><div class="kpi-sub">já receberam parte dos itens</div></div>'
      + '<div class="kpi-card" style="border-color:rgba(5,150,105,.25)"><div class="kpi-label">✅ Totalmente Recebidos</div><div class="kpi-value accent" style="font-size:26px">'+concluidos+'</div><div class="kpi-sub">itens completos</div></div>'
      + '<div class="kpi-card" style="border-color:rgba(0,58,112,.20)"><div class="kpi-label">🧾 NFs no Mês</div><div class="kpi-value info" style="font-size:26px">'+nfsMes+'</div><div class="kpi-sub">recebimentos registrados</div></div>';
  }

  if (!base.length) {
    table.innerHTML = '<div class="empty-state" style="padding:34px"><div class="icon">📥</div><h3>Nenhum pedido para recebimento</h3><p>Use os filtros ou avance pedidos para etapa de entrega.</p></div>';
  } else {
    const rows = base.map(p => {
      const totalItens = (p.itens || []).length;
      const recebidos = (p.itens || []).filter(i => getItemStatus(i) === 'Recebido').length;
      const parciaisItens = (p.itens || []).filter(i => getItemStatus(i) === 'Parcial').length;
      const saldoTotal = (p.itens || []).reduce((s,i) => s + getItemSaldo(i), 0);
      const nfs = getPedidoNFs(p).map(n => n.nf).join(', ') || '—';
      const situacao = pedidoRecebimentoSituacao(p);
      const firstItem = p.itens && p.itens[0] ? p.itens[0].descricao : '—';

      return '<tr>'
        + '<td class="clickable" onclick="openModal(\''+p.sc+'\')"><strong style="color:var(--accent2)">'+escapeHTML(p.sc)+'</strong></td>'
        + '<td class="clickable" onclick="openModal(\''+p.sc+'\')" style="max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHTML(firstItem)+'">'+escapeHTML(firstItem)+(totalItens>1?' <span style="color:var(--muted);font-size:11px">+'+(totalItens-1)+'</span>':'')+'</td>'
        + '<td>'+escapeHTML(p.empresa||'—')+'</td>'
        + '<td>'+escapeHTML(p.departamento||'—')+'</td>'
        + '<td><span class="status-badge status-'+statusKey(p.status)+'">'+escapeHTML(p.status||'—')+'</span></td>'
        + '<td>'+recebimentoSituacaoBadge(situacao)+'</td>'
        + '<td style="font-size:12px;color:var(--muted)">'+recebidos+'/'+totalItens+' recebidos'+(parciaisItens ? '<br><span style="color:#d97706">'+parciaisItens+' parcial(is)</span>' : '')+'</td>'
        + '<td style="font-weight:600;color:'+(saldoTotal>0?'#d97706':'#059669')+'">'+formatQty(saldoTotal)+'</td>'
        + '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHTML(nfs)+'">'+escapeHTML(nfs)+'</td>'
        + '<td style="white-space:nowrap">'
        + (pedidoPodeReceber(p) ? '<button class="btn btn-primary" style="padding:7px 12px;font-size:12px" onclick="openRecebimentoModal(\''+p.sc+'\')">📥 Registrar</button> ' : '')
        + '<button class="btn btn-secondary" style="padding:7px 12px;font-size:12px" onclick="openModal(\''+p.sc+'\')">Detalhes</button>'
        + '</td>'
        + '</tr>';
    }).join('');

    table.innerHTML =
      '<table><thead><tr>'
      + '<th>SC</th><th>Item</th><th>Empresa</th><th>Depto.</th><th>Status Pedido</th><th>Recebimento</th><th>Itens</th><th>Saldo</th><th>NF(s)</th><th>Ação</th>'
      + '</tr></thead><tbody>'+rows+'</tbody></table>';
  }

  if (hist) renderRecebimentosHistorico(hist);
}

function getTodosRecebimentos() {
  const recs = [];
  pedidos.forEach(p => {
    normalizePedidoItems(p);
    (p.itens || []).forEach((item, idx) => {
      (item.recebimentos || []).forEach(r => {
        recs.push({
          sc: p.sc,
          empresa: p.empresa || '',
          departamento: p.departamento || '',
          itemIdx: idx,
          item: item.descricao || 'Item',
          unidade: item.unidade || '',
          nf: r.nf || r.numeroNF || '',
          data: r.data || '',
          qtd: parseQtd(r.qtd ?? r.quantidade),
          volumes: parseQtd(r.volumes),
          recebidoPor: r.recebidoPor || '',
          obs: r.obs || '',
          criadoEm: r.criadoEm || ''
        });
      });
    });
  });
  return recs.sort((a,b) => (b.data || b.criadoEm || '').localeCompare(a.data || a.criadoEm || ''));
}

function renderRecebimentosHistorico(container) {
  const recs = getTodosRecebimentos().slice(0, 30);
  if (!recs.length) {
    container.innerHTML = '<div class="empty-state" style="padding:28px"><div class="icon">🧾</div><h3>Nenhum recebimento registrado</h3></div>';
    return;
  }

  container.innerHTML = '<table><thead><tr><th>Data</th><th>NF</th><th>SC</th><th>Item</th><th>Qtd.</th><th>Volumes</th><th>Recebido por</th><th>Obs.</th></tr></thead><tbody>'
    + recs.map(r => '<tr class="clickable" onclick="openModal(\''+r.sc+'\')">'
      + '<td>'+formatDate(r.data)+'</td>'
      + '<td><strong style="color:var(--accent2)">NF '+escapeHTML(r.nf || '—')+'</strong></td>'
      + '<td>'+escapeHTML(r.sc)+'</td>'
      + '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHTML(r.item)+'">'+escapeHTML(r.item)+'</td>'
      + '<td>'+formatQty(r.qtd)+' '+escapeHTML(r.unidade)+'</td>'
      + '<td>'+formatQty(r.volumes || 0)+'</td>'
      + '<td>'+escapeHTML(r.recebidoPor || '—')+'</td>'
      + '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHTML(r.obs || '')+'">'+escapeHTML(r.obs || '—')+'</td>'
      + '</tr>').join('')
    + '</tbody></table>';
}

// =========================================================
// v1.1.4 — EDITAR / APAGAR INFORMAÇÕES DAS ETAPAS
// =========================================================
const STATUS_INFO_CONFIG = [
  { status:'Cotação', role:'compras', fields:[
    { key:'dataCotacao', label:'Data da Cotação', type:'date' },
    { key:'fornecedorEsc', label:'Fornecedor Escolhido', type:'text' },
    { key:'valorCotacao', label:'Valor da 1ª Cotação', type:'number' }
  ]},
  { status:'Pedido de Compra', role:'compras', fields:[
    { key:'dataPedidoCompra', label:'Data do Pedido de Compra', type:'date' },
    { key:'docPC', label:'Nº Pedido de Compra', type:'text' },
    { key:'valorPago', label:'Valor Negociado / Pago', type:'number' }
  ]},
  { status:'Aguardando Pagamento', role:'compras', fields:[
    { key:'dataAguardando', label:'Data Aguardando Pagamento', type:'date' },
    { key:'docFatura', label:'Fatura / Documento de Pagamento', type:'text' }
  ]},
  { status:'A Caminho', role:'compras', fields:[
    { key:'dataACaminho', label:'Data A Caminho', type:'date' },
    { key:'rastreio', label:'Código de Rastreio', type:'text' },
    { key:'previsaoEntrega', label:'Previsão de Entrega', type:'date' }
  ]},
  { status:'Lançar NF', role:'almox', fields:[
    { key:'dataLancarNF', label:'Data Lançar NF', type:'date' },
    { key:'docNFE', label:'NF(s) de Entrada', type:'text' },
    { key:'dataRecebimento', label:'Data de Recebimento', type:'date' },
    { key:'recebidoPor', label:'Recebido Por', type:'text' }
  ]},
  { status:'Conferência', role:'almox', fields:[
    { key:'dataConferencia', label:'Data de Conferência', type:'date' }
  ]},
  { status:'Aguardando Identificação', role:'almox', fields:[
    { key:'dataAguardandoId', label:'Data de Identificação', type:'date' }
  ]},
  { status:'Amostragem', role:'almox', fields:[
    { key:'dataAmostragem', label:'Data de Amostragem', type:'date' }
  ]},
  { status:'Aguardando Retirada do Estoque', role:'almox', fields:[
    { key:'dataAguardandoRet', label:'Data de Retirada / Disponibilização', type:'date' }
  ]},
  { status:'Finalizado', role:'almox', fields:[
    { key:'dataFinalizado', label:'Data Finalizado', type:'date' },
    { key:'finalizadoPor', label:'Finalizado Por', type:'text' }
  ]},
  { status:'Cancelado', role:'compras', fields:[
    { key:'dataCancelado', label:'Data Cancelamento', type:'date' }
  ]}
];

function canEditStatusInfoGroup(cfg) {
  if (window.compradorMode) return true;
  if (window.almoxarifeMode) return cfg.role === 'almox';
  return false;
}

function getStatusInfoConfigsPermitidas() {
  return STATUS_INFO_CONFIG.filter(canEditStatusInfoGroup);
}

function statusInfoInputId(status, key) {
  return 'stinfo-' + status.replace(/[^a-zA-Z0-9]/g, '_') + '-' + key;
}

function renderStatusInfoGroup(p, cfg) {
  const inputs = cfg.fields.map(f => {
    const value = f.key === 'finalizadoPor' ? getFinalizadoPor(p) : (p[f.key] ?? '');
    const step = f.type === 'number' ? ' step="0.01" min="0"' : '';
    return '<div class="form-group">'
      + '<label>' + escapeHTML(f.label) + '</label>'
      + '<input id="' + statusInfoInputId(cfg.status, f.key) + '" type="' + f.type + '" value="' + escapeHTML(value) + '"' + step + ' style="width:100%">'
      + '</div>';
  }).join('');

  return '<div style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:14px">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap">'
    + '<div style="font-family:Inter,sans-serif;font-weight:700;color:var(--accent2)">🧩 ' + escapeHTML(cfg.status) + '</div>'
    + '<button class="btn btn-danger" style="padding:7px 12px;font-size:12px" onclick="clearStatusInfo(\'' + escapeHTML(p.sc) + '\',\'' + escapeHTML(cfg.status) + '\')">Apagar etapa</button>'
    + '</div>'
    + '<div class="form-grid col3" style="gap:12px">' + inputs + '</div>'
    + '</div>';
}

function renderRecebimentosEditor(p) {
  const canEditReceb = window.compradorMode || window.almoxarifeMode;
  if (!canEditReceb) return '';
  let rows = '';
  (p.itens || []).forEach((item, itemIdx) => {
    (item.recebimentos || []).forEach((r, recIdx) => {
      rows += '<tr>'
        + '<td style="padding:8px;max-width:180px;overflow:hidden;text-overflow:ellipsis" title="'+escapeHTML(item.descricao||'')+'">' + escapeHTML(item.descricao || 'Item') + '</td>'
        + '<td style="padding:8px"><input class="rec-edit-nf" data-item="'+itemIdx+'" data-rec="'+recIdx+'" value="'+escapeHTML(r.nf||'')+'" style="width:100px"></td>'
        + '<td style="padding:8px"><input class="rec-edit-data" type="date" data-item="'+itemIdx+'" data-rec="'+recIdx+'" value="'+escapeHTML(r.data||'')+'" style="width:135px"></td>'
        + '<td style="padding:8px"><input class="rec-edit-qtd" type="number" step="0.01" min="0" data-item="'+itemIdx+'" data-rec="'+recIdx+'" value="'+escapeHTML(r.qtd ?? r.quantidade ?? '')+'" style="width:90px"></td>'
        + '<td style="padding:8px"><input class="rec-edit-por" data-item="'+itemIdx+'" data-rec="'+recIdx+'" value="'+escapeHTML(r.recebidoPor||'')+'" style="width:130px"></td>'
        + '<td style="padding:8px"><button class="btn btn-danger" style="padding:6px 10px;font-size:12px" onclick="deleteRecebimentoLinha(\''+escapeHTML(p.sc)+'\','+itemIdx+','+recIdx+')">Apagar</button></td>'
        + '</tr>';
    });
  });

  if (!rows) {
    return '<div style="background:rgba(0,58,112,0.04);border:1px dashed var(--border);border-radius:12px;padding:16px;margin-top:10px;color:var(--muted);font-size:13px">Nenhum recebimento/NF registrado ainda.</div>';
  }

  return '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;margin-top:8px;margin-bottom:14px">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap">'
    + '<div style="font-family:Inter,sans-serif;font-weight:700;color:var(--accent2)">🧾 Recebimentos / NFs por item</div>'
    + '<button class="btn btn-danger" style="padding:7px 12px;font-size:12px" onclick="clearAllRecebimentos(\''+escapeHTML(p.sc)+'\')">Apagar todos os recebimentos</button>'
    + '</div>'
    + '<div class="data-table-wrap"><table style="width:100%;font-size:13px"><thead><tr><th>Item</th><th>NF</th><th>Data</th><th>Qtd.</th><th>Recebido por</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    + '<div style="font-size:12px;color:var(--muted);margin-top:10px">Ao salvar, os saldos dos itens, NF(s) do pedido, status e KPIs serão recalculados automaticamente.</div>'
    + '</div>';
}

function openStatusInfoEditor(sc) {
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;
  const configs = getStatusInfoConfigsPermitidas();
  if (!configs.length) { toast('Você não tem permissão para editar informações das etapas.', 'error'); return; }

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header">'
    + '<div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700">✏️ Editar / Apagar informações das etapas</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">' + escapeHTML(p.sc) + ' · alterações recalculam saldos, status e KPIs</div></div>'
    + '<button class="modal-close" onclick="openModal(\''+escapeHTML(sc)+'\')">✕</button></div>'
    + '<div style="margin-bottom:14px;padding:12px 14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.22);border-radius:10px;font-size:13px;color:#92400e">Use <strong>Apagar etapa</strong> para remover dados lançados por engano, ou edite os campos e clique em salvar. Comprador edita todas as etapas; Almoxarife edita etapas operacionais.</div>'
    + configs.map(cfg => renderStatusInfoGroup(p, cfg)).join('')
    + '<div class="card-title" style="margin-top:18px"><span>📦</span> Recebimentos e múltiplas NFs</div>'
    + renderRecebimentosEditor(p)
    + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap">'
    + '<button class="btn btn-secondary" onclick="openModal(\''+escapeHTML(sc)+'\')">Cancelar</button>'
    + '<button class="btn btn-primary" onclick="saveStatusInfoEditor(\''+escapeHTML(sc)+'\')">Salvar alterações</button>'
    + '</div>';
  document.getElementById('modal-overlay').classList.add('open');
}

function applyStatusInfoInputsToPedido(p) {
  getStatusInfoConfigsPermitidas().forEach(cfg => {
    cfg.fields.forEach(f => {
      const el = document.getElementById(statusInfoInputId(cfg.status, f.key));
      if (!el) return;
      if (f.key === 'finalizadoPor') setFinalizadoPor(p, el.value || '');
      else if (f.type === 'number') p[f.key] = parseQtd(el.value) || 0;
      else p[f.key] = el.value || '';
    });
  });

  // Recalcula saving caso cotação/valor pago tenham sido editados.
  if (p.valorCotacao && p.valorPago) p.saving = parseQtd(p.valorCotacao) - parseQtd(p.valorPago);
  if (p.valorRef && p.valorPago) p.savingRef = parseQtd(p.valorRef) - parseQtd(p.valorPago);
}

function applyRecebimentosEditorToPedido(p) {
  document.querySelectorAll('.rec-edit-nf').forEach(el => {
    const item = p.itens[parseInt(el.dataset.item, 10)];
    const rec = item?.recebimentos?.[parseInt(el.dataset.rec, 10)];
    if (rec) rec.nf = el.value.trim();
  });
  document.querySelectorAll('.rec-edit-data').forEach(el => {
    const item = p.itens[parseInt(el.dataset.item, 10)];
    const rec = item?.recebimentos?.[parseInt(el.dataset.rec, 10)];
    if (rec) rec.data = el.value;
  });
  document.querySelectorAll('.rec-edit-qtd').forEach(el => {
    const item = p.itens[parseInt(el.dataset.item, 10)];
    const rec = item?.recebimentos?.[parseInt(el.dataset.rec, 10)];
    if (rec) rec.qtd = parseQtd(el.value) || 0;
  });
  document.querySelectorAll('.rec-edit-por').forEach(el => {
    const item = p.itens[parseInt(el.dataset.item, 10)];
    const rec = item?.recebimentos?.[parseInt(el.dataset.rec, 10)];
    if (rec) rec.recebidoPor = el.value.trim();
  });
  (p.itens || []).forEach(item => {
    if (Array.isArray(item.recebimentos)) item.recebimentos = item.recebimentos.filter(r => parseQtd(r.qtd) > 0 || (r.nf || '').trim());
    normalizeItem(item);
  });
}

async function saveStatusInfoEditor(sc) {
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;
  applyStatusInfoInputsToPedido(p);
  applyRecebimentosEditorToPedido(p);
  recalcPedidoRecebimento(p);
  await dbUpdate(p);
  await dbLoad();
  renderPedidosTable();
  renderProgramadasTable();
  renderDashboard();
  toast('Informações atualizadas e KPIs recalculados.', 'success');
  openModal(sc);
}

function clearFieldsForStatus(p, status) {
  const cfg = STATUS_INFO_CONFIG.find(c => c.status === status);
  if (!cfg) return;
  cfg.fields.forEach(f => { p[f.key] = ''; });

  if (status === 'Cotação') {
    p.valorCotacao = 0; p.fornecedorEsc = ''; p.saving = 0;
  }
  if (status === 'Pedido de Compra') {
    p.docPC = ''; p.valorPago = 0; p.saving = 0; p.savingRef = 0;
  }
  if (status === 'Lançar NF') {
    p.docNFE = ''; p.dataLancarNF = ''; p.dataRecebimento = ''; p.recebidoPor = '';
  }
  if (status === 'Finalizado') { p.dataFinalizado = ''; clearFinalizadoPor(p); }
  if (status === 'Cancelado') p.dataCancelado = '';
}

async function clearStatusInfo(sc, status) {
  const cfg = STATUS_INFO_CONFIG.find(c => c.status === status);
  if (!cfg || !canEditStatusInfoGroup(cfg)) { toast('Você não tem permissão para apagar esta etapa.', 'error'); return; }
  if (!confirm('Apagar as informações da etapa "' + status + '" desta solicitação?')) return;
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;
  clearFieldsForStatus(p, status);
  recalcPedidoRecebimento(p);
  await dbUpdate(p);
  await dbLoad();
  renderPedidosTable();
  renderProgramadasTable();
  renderDashboard();
  toast('Informações da etapa apagadas e KPIs atualizados.', 'success');
  openStatusInfoEditor(sc);
}

async function deleteRecebimentoLinha(sc, itemIdx, recIdx) {
  if (!(window.compradorMode || window.almoxarifeMode)) { toast('Sem permissão para apagar recebimentos.', 'error'); return; }
  if (!confirm('Apagar este recebimento/NF do item?')) return;
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p || !p.itens[itemIdx] || !p.itens[itemIdx].recebimentos) return;
  p.itens[itemIdx].recebimentos.splice(recIdx, 1);
  normalizeItem(p.itens[itemIdx]);
  recalcPedidoRecebimento(p);
  await dbUpdate(p);
  await dbLoad();
  renderPedidosTable();
  renderProgramadasTable();
  renderDashboard();
  toast('Recebimento apagado e KPIs atualizados.', 'success');
  openStatusInfoEditor(sc);
}

async function clearAllRecebimentos(sc) {
  if (!(window.compradorMode || window.almoxarifeMode)) { toast('Sem permissão para apagar recebimentos.', 'error'); return; }
  if (!confirm('Apagar TODOS os recebimentos/NFs desta solicitação?')) return;
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;
  (p.itens || []).forEach(item => { item.recebimentos = []; item.qtdRecebida = 0; item.statusItem = 'Pendente'; normalizeItem(item); });
  p.docNFE = '';
  p.dataLancarNF = '';
  p.dataRecebimento = '';
  p.recebidoPor = '';
  if (['Recebimento Parcial','Lançar NF'].includes(p.status)) p.status = 'A Caminho';
  await dbUpdate(p);
  await dbLoad();
  renderPedidosTable();
  renderProgramadasTable();
  renderDashboard();
  toast('Recebimentos apagados e pedido recalculado.', 'success');
  openStatusInfoEditor(sc);
}

// =========================================================
// v1.1.6 — SAVING POR ITEM E FORNECEDORES COTADOS
// =========================================================
(function initV116SavingPorItem(){
  // Mantém compatibilidade com versões anteriores: itens antigos continuam funcionando.
  if (typeof normalizeItem === 'function' && !window._v116_normalizeItemWrapped) {
    window._v116_normalizeItemWrapped = true;
    const _oldNormalizeItem = normalizeItem;
    normalizeItem = function(item) {
      item = _oldNormalizeItem(item || {});
      if (item.valorCotadoItem === undefined && item.valorCotado !== undefined) item.valorCotadoItem = item.valorCotado;
      if (item.valorNegociadoItem === undefined && item.valorNegociado !== undefined) item.valorNegociadoItem = item.valorNegociado;
      if (item.fornecedorCotado === undefined) item.fornecedorCotado = '';
      if (item.fornecedorComprado === undefined) item.fornecedorComprado = '';
      if (item.obsNegociacao === undefined) item.obsNegociacao = '';
      item.savingItem = getItemSavingValue(item);
      return item;
    };
  }

  if (typeof renderDashboard === 'function' && !window._v116_renderDashboardWrapped) {
    window._v116_renderDashboardWrapped = true;
    const _oldRenderDashboard = renderDashboard;
    renderDashboard = function() {
      pedidos.forEach(p => recalcPedidoFinanceiroPorItem(p));
      return _oldRenderDashboard.apply(this, arguments);
    };
  }

  if (typeof selectStatusOption === 'function' && !window._v116_selectStatusWrapped) {
    window._v116_selectStatusWrapped = true;
    const _oldSelectStatusOption = selectStatusOption;
    selectStatusOption = function(el, next) {
      const r = _oldSelectStatusOption.apply(this, arguments);
      try { injectSavingPorItemNoStatus(next); } catch(e) { console.warn('saving item UI error', e); }
      return r;
    };
  }

  if (typeof confirmUpdateStatus === 'function' && !window._v116_confirmStatusWrapped) {
    window._v116_confirmStatusWrapped = true;
    const _oldConfirmUpdateStatus = confirmUpdateStatus;
    confirmUpdateStatus = function() {
      const sc = window._currentUpdateSC;
      const p = pedidos.find(x => x.sc === sc);
      if (p) {
        applySavingPorItemInputs(p);
        recalcPedidoFinanceiroPorItem(p);
        // Alimenta os campos agregados já existentes para manter validação e KPIs antigos funcionando.
        const cot = document.getElementById('us-cotacao');
        const pago = document.getElementById('us-valorpago');
        if (cot && pedidoTemFinanceiroPorItem(p)) cot.value = parseQtd(p.valorCotacao).toFixed(2);
        if (pago && pedidoTemFinanceiroPorItem(p)) pago.value = parseQtd(p.valorPago).toFixed(2);
      }
      return _oldConfirmUpdateStatus.apply(this, arguments);
    };
  }

  if (typeof openModal === 'function' && !window._v116_openModalWrapped) {
    window._v116_openModalWrapped = true;
    const _oldOpenModal = openModal;
    openModal = function(sc) {
      const r = _oldOpenModal.apply(this, arguments);
      try { injectResumoSavingPorItem(sc); } catch(e) { console.warn('saving summary error', e); }
      return r;
    };
  }

  if (typeof openStatusInfoEditor === 'function' && !window._v116_statusInfoWrapped) {
    window._v116_statusInfoWrapped = true;
    const _oldOpenStatusInfoEditor = openStatusInfoEditor;
    openStatusInfoEditor = function(sc) {
      const r = _oldOpenStatusInfoEditor.apply(this, arguments);
      try { injectEditorSavingPorItem(sc); } catch(e) { console.warn('saving editor error', e); }
      return r;
    };
  }

  if (typeof saveStatusInfoEditor === 'function' && !window._v116_saveStatusInfoWrapped) {
    window._v116_saveStatusInfoWrapped = true;
    const _oldSaveStatusInfoEditor = saveStatusInfoEditor;
    saveStatusInfoEditor = async function(sc) {
      const p = pedidos.find(x => x.sc === sc);
      if (p) {
        applySavingPorItemInputs(p);
        recalcPedidoFinanceiroPorItem(p);
      }
      return await _oldSaveStatusInfoEditor.apply(this, arguments);
    };
  }
})();

function getItemValorCotado(item) {
  return parseQtd(item?.valorCotadoItem ?? item?.valorCotado ?? 0);
}

function getItemValorNegociado(item) {
  return parseQtd(item?.valorNegociadoItem ?? item?.valorNegociado ?? 0);
}

function getItemSavingValue(item) {
  const cotado = getItemValorCotado(item);
  const comprado = getItemValorNegociado(item);
  if (!cotado && !comprado) return 0;
  return cotado - comprado;
}

function itemTemFinanceiro(item) {
  return !!(getItemValorCotado(item) || getItemValorNegociado(item) || item?.fornecedorCotado || item?.fornecedorComprado || item?.obsNegociacao);
}

function pedidoTemFinanceiroPorItem(p) {
  return !!(p && Array.isArray(p.itens) && p.itens.some(itemTemFinanceiro));
}

function recalcPedidoFinanceiroPorItem(p) {
  if (!p || !Array.isArray(p.itens)) return p;
  p.itens.forEach(item => {
    item.savingItem = getItemSavingValue(item);
  });
  if (!pedidoTemFinanceiroPorItem(p)) return p;

  const totalCotado = p.itens.reduce((s, i) => s + getItemValorCotado(i), 0);
  const totalPago = p.itens.reduce((s, i) => s + getItemValorNegociado(i), 0);
  const totalSaving = p.itens.reduce((s, i) => s + getItemSavingValue(i), 0);

  // O saving por item passa a ser a base prioritária dos KPIs.
  p.valorCotacao = totalCotado;
  p.valorPago = totalPago;
  p.saving = totalSaving;
  if (p.valorRef && totalPago) p.savingRef = parseQtd(p.valorRef) - totalPago;
  return p;
}

function buildSavingPorItemEditor(p, modo) {
  p = normalizePedidoItems(p);
  const isCotacao = modo === 'cotacao';
  const titulo = isCotacao ? '💬 Cotação por item' : '📝 Valor negociado por item';
  const ajuda = isCotacao
    ? 'Informe o fornecedor e o valor cotado de cada item. Ex.: cotado no fornecedor X, valor Y.'
    : 'Informe o fornecedor comprado e o valor negociado de cada item. Ex.: comprado no fornecedor A, valor B.';

  const rows = (p.itens || []).map((item, idx) => {
    const qtd = formatQty(getItemQtd(item));
    return '<tr>'
      + '<td style="padding:8px;min-width:180px"><strong>'+escapeHTML(item.descricao||'Item')+'</strong><div style="font-size:11px;color:var(--muted)">Qtd: '+qtd+' '+escapeHTML(item.unidade||'')+(item.ref?' · Ref: '+escapeHTML(item.ref):'')+'</div></td>'
      + '<td style="padding:8px"><input class="fin-forn-cotado" data-idx="'+idx+'" value="'+escapeHTML(item.fornecedorCotado||'')+'" placeholder="Fornecedor cotado" style="width:150px"></td>'
      + '<td style="padding:8px"><input class="fin-valor-cotado" data-idx="'+idx+'" type="number" step="0.01" min="0" value="'+escapeHTML(getItemValorCotado(item) || '')+'" placeholder="0,00" style="width:105px"></td>'
      + '<td style="padding:8px"><input class="fin-forn-comprado" data-idx="'+idx+'" value="'+escapeHTML(item.fornecedorComprado||'')+'" placeholder="Fornecedor comprado" style="width:150px"></td>'
      + '<td style="padding:8px"><input class="fin-valor-comprado" data-idx="'+idx+'" type="number" step="0.01" min="0" value="'+escapeHTML(getItemValorNegociado(item) || '')+'" placeholder="0,00" style="width:105px"></td>'
      + '<td style="padding:8px"><input class="fin-obs" data-idx="'+idx+'" value="'+escapeHTML(item.obsNegociacao||'')+'" placeholder="Ex.: desconto só neste item" style="width:180px"></td>'
      + '<td style="padding:8px"><strong style="color:#059669">'+fmtBRL(getItemSavingValue(item))+'</strong></td>'
      + '</tr>';
  }).join('');

  return '<div id="saving-item-editor" style="background:rgba(0,169,157,0.05);border:1px solid rgba(0,169,157,0.18);border-radius:12px;padding:16px;margin-bottom:14px">'
    + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px">'
    + '<div><div style="font-family:Inter,sans-serif;font-weight:700;color:var(--accent2)">'+titulo+'</div>'
    + '<div style="font-size:12px;color:var(--muted);margin-top:3px">'+ajuda+'</div></div>'
    + '<button type="button" class="btn btn-secondary" style="padding:7px 12px;font-size:12px" onclick="limparSavingPorItemInputs()">Limpar valores por item</button>'
    + '</div>'
    + '<div class="data-table-wrap"><table style="width:100%;font-size:13px"><thead><tr>'
    + '<th>Item</th><th>Fornecedor cotado</th><th>Valor cotado</th><th>Fornecedor comprado</th><th>Valor comprado</th><th>Observação</th><th>Saving</th>'
    + '</tr></thead><tbody>'+rows+'</tbody></table></div>'
    + '<div class="saving-scroll-control"><span>↔ Deslize para ver os demais campos</span><input class="saving-scroll-range" type="range" min="0" max="1000" value="0" oninput="scrollSavingItemTable(this.value)"></div>'
    + '<div style="font-size:12px;color:var(--muted);margin-top:10px">O KPI de Saving usará a soma dos itens quando houver qualquer valor preenchido por item.</div>'
    + '</div>';
}

function injectSavingPorItemNoStatus(next) {
  if (!['Cotação','Pedido de Compra'].includes(next)) return;
  const sc = window._currentUpdateSC;
  const p = pedidos.find(x => x.sc === sc);
  const container = document.getElementById('status-extra-fields');
  if (!p || !container || document.getElementById('saving-item-editor')) return;
  const html = buildSavingPorItemEditor(p, next === 'Cotação' ? 'cotacao' : 'compra');
  const hr = container.querySelector('hr');
  if (hr) hr.insertAdjacentHTML('beforebegin', html);
  else container.insertAdjacentHTML('afterbegin', html);
}

function applySavingPorItemInputs(p) {
  if (!p || !Array.isArray(p.itens)) return p;
  const touched = document.querySelector('.fin-forn-cotado,.fin-valor-cotado,.fin-forn-comprado,.fin-valor-comprado,.fin-obs');
  if (!touched) return p;

  document.querySelectorAll('.fin-forn-cotado').forEach(el => {
    const item = p.itens[parseInt(el.dataset.idx, 10)];
    if (item) item.fornecedorCotado = el.value.trim();
  });
  document.querySelectorAll('.fin-valor-cotado').forEach(el => {
    const item = p.itens[parseInt(el.dataset.idx, 10)];
    if (item) item.valorCotadoItem = parseQtd(el.value) || 0;
  });
  document.querySelectorAll('.fin-forn-comprado').forEach(el => {
    const item = p.itens[parseInt(el.dataset.idx, 10)];
    if (item) item.fornecedorComprado = el.value.trim();
  });
  document.querySelectorAll('.fin-valor-comprado').forEach(el => {
    const item = p.itens[parseInt(el.dataset.idx, 10)];
    if (item) item.valorNegociadoItem = parseQtd(el.value) || 0;
  });
  document.querySelectorAll('.fin-obs').forEach(el => {
    const item = p.itens[parseInt(el.dataset.idx, 10)];
    if (item) item.obsNegociacao = el.value.trim();
  });
  recalcPedidoFinanceiroPorItem(p);
  return p;
}

function limparSavingPorItemInputs() {
  document.querySelectorAll('.fin-forn-cotado,.fin-forn-comprado,.fin-obs').forEach(el => el.value = '');
  document.querySelectorAll('.fin-valor-cotado,.fin-valor-comprado').forEach(el => el.value = '');
  toast('Campos de saving por item limpos na tela. Clique em salvar/confirmar para gravar.', 'success');
}

function buildResumoSavingPorItem(p) {
  if (!pedidoTemFinanceiroPorItem(p)) return '';
  recalcPedidoFinanceiroPorItem(p);
  const rows = (p.itens || []).filter(itemTemFinanceiro).map(item => {
    const saving = getItemSavingValue(item);
    const cor = saving >= 0 ? '#059669' : '#dc2626';
    return '<tr>'
      + '<td style="padding:8px">'+escapeHTML(item.descricao||'Item')+'</td>'
      + '<td style="padding:8px">'+(item.fornecedorCotado ? escapeHTML(item.fornecedorCotado) : '—')+'</td>'
      + '<td style="padding:8px;color:#f59e0b">'+fmtBRL(getItemValorCotado(item))+'</td>'
      + '<td style="padding:8px">'+(item.fornecedorComprado ? escapeHTML(item.fornecedorComprado) : '—')+'</td>'
      + '<td style="padding:8px;color:#00a99d">'+fmtBRL(getItemValorNegociado(item))+'</td>'
      + '<td style="padding:8px"><strong style="color:'+cor+'">'+fmtBRL(saving)+'</strong></td>'
      + '<td style="padding:8px;color:var(--muted)">'+(item.obsNegociacao ? escapeHTML(item.obsNegociacao) : '—')+'</td>'
      + '</tr>';
  }).join('');

  return '<div id="resumo-saving-item" style="margin-top:18px;background:rgba(0,169,157,0.06);border:1px solid rgba(0,169,157,0.18);border-radius:12px;padding:16px">'
    + '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px">'
    + '<div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">💰 Saving por item</div>'
    + '<div style="font-size:13px"><strong>Cotado:</strong> '+fmtBRL(p.valorCotacao)+' · <strong>Comprado:</strong> '+fmtBRL(p.valorPago)+' · <strong style="color:#059669">Saving: '+fmtBRL(p.saving)+'</strong></div>'
    + '</div>'
    + '<div class="data-table-wrap"><table style="width:100%;font-size:13px"><thead><tr><th>Item</th><th>Fornecedor cotado</th><th>Valor cotado</th><th>Fornecedor comprado</th><th>Valor comprado</th><th>Saving</th><th>Observação</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    + '</div>';
}

function injectResumoSavingPorItem(sc) {
  const p = pedidos.find(x => x.sc === sc);
  const modal = document.getElementById('modal-content');
  if (!p || !modal || !pedidoTemFinanceiroPorItem(p) || document.getElementById('resumo-saving-item')) return;
  const html = buildResumoSavingPorItem(p);
  const marker = modal.innerHTML.indexOf('<div class="card-title"><span>🗺</span> Acompanhamento</div>');
  if (marker >= 0) {
    modal.innerHTML = modal.innerHTML.slice(0, marker) + html + modal.innerHTML.slice(marker);
  } else {
    modal.insertAdjacentHTML('beforeend', html);
  }
}

function injectEditorSavingPorItem(sc) {
  const p = pedidos.find(x => x.sc === sc);
  const modal = document.getElementById('modal-content');
  if (!p || !modal || document.getElementById('saving-item-editor')) return;
  const html = '<div class="card-title" style="margin-top:18px"><span>💰</span> Saving por item</div>' + buildSavingPorItemEditor(p, 'editor');
  const marker = '<div class="card-title" style="margin-top:18px"><span>📦</span> Recebimentos e múltiplas NFs</div>';
  const idx = modal.innerHTML.indexOf(marker);
  if (idx >= 0) modal.innerHTML = modal.innerHTML.slice(0, idx) + html + modal.innerHTML.slice(idx);
  else modal.insertAdjacentHTML('beforeend', html);
}

function getLinhasSavingDetalhado(tipo) {
  const linhas = [];
  pedidos.forEach(p => {
    recalcPedidoFinanceiroPorItem(p);
    if (pedidoTemFinanceiroPorItem(p)) {
      (p.itens || []).forEach(item => {
        if (!itemTemFinanceiro(item)) return;
        const base = tipo === 'ref' ? parseQtd(p.valorRef) : getItemValorCotado(item);
        const pago = getItemValorNegociado(item);
        const saving = tipo === 'ref' ? 0 : getItemSavingValue(item);
        if (tipo === 'ref') return; // referência continua por pedido, pois hoje não existe referência por item.
        if (saving <= 0) return;
        linhas.push({ p, item, base, pago, saving, pct: base > 0 ? saving / base * 100 : 0, porItem: true });
      });
    } else {
      const saving = tipo === 'cotacao' ? parseQtd(p.saving) : parseQtd(p.savingRef);
      const base = tipo === 'cotacao' ? parseQtd(p.valorCotacao) : parseQtd(p.valorRef);
      const pago = parseQtd(p.valorPago);
      if (saving > 0) linhas.push({ p, item: null, base, pago, saving, pct: base > 0 ? saving / base * 100 : 0, porItem: false });
    }
  });
  return linhas.sort((a,b) => b.saving - a.saving);
}

function openSavingModal(tipo) {
  const linhas = getLinhasSavingDetalhado(tipo);
  const totalS = linhas.reduce((s,l) => s + l.saving, 0);
  const titulo = tipo === 'cotacao' ? 'Saving: Cotação → Pago' : 'Saving: Referência → Pago';
  const cor = tipo === 'cotacao' ? '#34d399' : '#60a5fa';

  const rows = linhas.map(l => {
    return '<tr class="clickable" onclick="closeModal();setTimeout(()=>openModal(\'' + escapeHTML(l.p.sc) + '\'),100)">'
      + '<td><strong style="color:var(--accent)">'+escapeHTML(l.p.sc)+'</strong></td>'
      + '<td>'+escapeHTML(l.p.empresa||'—')+'</td>'
      + '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHTML(l.item ? l.item.descricao : ((l.p.itens&&l.p.itens[0]?.descricao)||''))+'">'+escapeHTML(l.item ? l.item.descricao : ((l.p.itens&&l.p.itens[0]?.descricao)||'Pedido'))+'</td>'
      + '<td>'+escapeHTML(l.item?.fornecedorCotado || l.p.fornecedorEsc || l.p.fornecedorSug || '—')+'</td>'
      + '<td>'+escapeHTML(l.item?.fornecedorComprado || l.p.fornecedorEsc || '—')+'</td>'
      + '<td style="color:var(--muted)">'+fmtBRL(l.base)+'</td>'
      + '<td style="color:var(--muted)">'+fmtBRL(l.pago)+'</td>'
      + '<td><strong style="color:'+cor+'">'+fmtBRL(l.saving)+'</strong></td>'
      + '<td style="color:'+cor+'">'+fmtPct(l.pct)+'</td>'
      + '</tr>';
  }).join('');

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <div>
        <div style="font-family:'Inter',sans-serif;font-size:20px;font-weight:700">📉 ${titulo}</div>
        <div style="color:var(--muted);font-size:13px;margin-top:4px">${linhas.length} linha${linhas.length !== 1 ? 's' : ''} com saving registrado ${tipo === 'cotacao' ? '(pedido ou item)' : ''}</div>
      </div>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:16px;text-align:center">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Total Economizado</div>
        <div style="font-size:24px;font-weight:700;font-family:'Inter',sans-serif;color:${cor}">${fmtBRL(totalS)}</div>
      </div>
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center">
        <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px">Linhas com Saving</div>
        <div style="font-size:24px;font-weight:700;font-family:'Inter',sans-serif;color:var(--text)">${linhas.length}</div>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <thead><tr><th>SC</th><th>Empresa</th><th>Item</th><th>Forn. cotado</th><th>Forn. comprado</th><th>${tipo === 'cotacao' ? 'Cotado' : 'Referência'}</th><th>Comprado</th><th>Saving</th><th>%</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="9" style="padding:20px;text-align:center;color:var(--muted)">Nenhum saving registrado ainda.</td></tr>'}</tbody>
      </table>
    </div>
    <div style="margin-top:16px;text-align:right"><button class="btn btn-secondary" onclick="closeModal()">Fechar</button></div>
  `;
  document.getElementById('modal-overlay').classList.add('open');
}

// =========================================================
// v1.1.7 — EXIBIR NEGOCIAÇÃO POR ITEM NO ATUALIZAR STATUS
// =========================================================
(function initV117SavingNoAtualizarStatus(){
  if (window._v117_savingStatusInstalled) return;
  window._v117_savingStatusInstalled = true;

  function hideLegacyFinanceFields(next) {
    const hideGroup = (id) => {
      const el = document.getElementById(id);
      const group = el && el.closest ? el.closest('.form-group') : null;
      if (group) group.style.display = 'none';
    };
    if (next === 'Cotação') {
      hideGroup('us-fornecedor');
      hideGroup('us-cotacao');
    }
    if (next === 'Pedido de Compra') {
      hideGroup('us-valorpago');
    }
  }

  function v117FmtBRL(v) {
    if (typeof fmtBRL === 'function') return fmtBRL(v);
    const n = Number(v || 0);
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function v117Parse(v) {
    if (typeof parseQtd === 'function') return parseQtd(v);
    if (v === null || v === undefined || v === '') return 0;
    return parseFloat(String(v).replace(',', '.')) || 0;
  }

  function v117Escape(v) {
    if (typeof escapeHTML === 'function') return escapeHTML(v);
    return String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function v117GetQtd(item) {
    if (typeof getItemQtd === 'function') return getItemQtd(item);
    return v117Parse(item && (item.qtd ?? item.quantidade ?? item.qtdSolicitada));
  }

  function v117ValorCotado(item) {
    return v117Parse(item && (item.valorCotadoItem ?? item.valorCotado ?? 0));
  }

  function v117ValorComprado(item) {
    return v117Parse(item && (item.valorNegociadoItem ?? item.valorNegociado ?? 0));
  }

  function v117Saving(item) {
    const cotado = v117ValorCotado(item);
    const comprado = v117ValorComprado(item);
    if (!cotado && !comprado) return 0;
    return cotado - comprado;
  }

  function v117NormalizaPedido(p) {
    if (!p) return p;
    if (typeof normalizePedidoItems === 'function') p = normalizePedidoItems(p);
    if (!Array.isArray(p.itens)) p.itens = [];
    p.itens.forEach(item => {
      if (item.fornecedorCotado === undefined) item.fornecedorCotado = '';
      if (item.fornecedorComprado === undefined) item.fornecedorComprado = '';
      if (item.valorCotadoItem === undefined && item.valorCotado !== undefined) item.valorCotadoItem = item.valorCotado;
      if (item.valorNegociadoItem === undefined && item.valorNegociado !== undefined) item.valorNegociadoItem = item.valorNegociado;
      if (item.obsNegociacao === undefined) item.obsNegociacao = '';
      item.savingItem = v117Saving(item);
    });
    return p;
  }

  function v117BuildStatusFinanceiro(p, next) {
    p = v117NormalizaPedido(p);
    if (!p || !Array.isArray(p.itens) || !['Cotação','Pedido de Compra'].includes(next)) return '';

    const isCotacao = next === 'Cotação';
    const titulo = isCotacao ? '💬 Cotação por item' : '📝 Negociação / Compra por item';
    const ajuda = isCotacao
      ? 'Preencha o fornecedor cotado e o valor cotado de cada item. O valor geral da cotação será calculado automaticamente.'
      : 'Preencha o fornecedor comprado e o valor negociado de cada item. O saving será calculado automaticamente por item e somado no KPI.';

    const rows = p.itens.map((item, idx) => {
      const qtd = v117GetQtd(item);
      const desc = v117Escape(item.descricao || 'Item ' + (idx + 1));
      const unidade = v117Escape(item.unidade || '');
      const ref = item.ref ? ' · Ref: ' + v117Escape(item.ref) : '';

      if (isCotacao) {
        return '<tr>'
          + '<td style="padding:8px;min-width:210px"><strong>' + desc + '</strong><div style="font-size:11px;color:var(--muted)">Qtd: ' + qtd + ' ' + unidade + ref + '</div></td>'
          + '<td style="padding:8px"><input class="v117-forn-cotado" data-idx="' + idx + '" value="' + v117Escape(item.fornecedorCotado || '') + '" placeholder="Fornecedor cotado" style="width:170px"></td>'
          + '<td style="padding:8px"><input class="v117-valor-cotado" data-idx="' + idx + '" type="number" step="0.01" min="0" value="' + (v117ValorCotado(item) || '') + '" placeholder="0,00" style="width:120px" oninput="v117AtualizarPreviewSaving()"></td>'
          + '<td style="padding:8px"><input class="v117-obs-neg" data-idx="' + idx + '" value="' + v117Escape(item.obsNegociacao || '') + '" placeholder="Ex.: cotado no fornecedor X" style="width:220px"></td>'
          + '</tr>';
      }

      return '<tr>'
        + '<td style="padding:8px;min-width:210px"><strong>' + desc + '</strong><div style="font-size:11px;color:var(--muted)">Qtd: ' + qtd + ' ' + unidade + ref + '</div></td>'
        + '<td style="padding:8px"><input class="v117-forn-cotado" data-idx="' + idx + '" value="' + v117Escape(item.fornecedorCotado || '') + '" placeholder="Fornecedor cotado" style="width:150px"></td>'
        + '<td style="padding:8px"><input class="v117-valor-cotado" data-idx="' + idx + '" type="number" step="0.01" min="0" value="' + (v117ValorCotado(item) || '') + '" placeholder="0,00" style="width:105px" oninput="v117AtualizarPreviewSaving()"></td>'
        + '<td style="padding:8px"><input class="v117-forn-comprado" data-idx="' + idx + '" value="' + v117Escape(item.fornecedorComprado || '') + '" placeholder="Fornecedor comprado" style="width:150px"></td>'
        + '<td style="padding:8px"><input class="v117-valor-comprado" data-idx="' + idx + '" type="number" step="0.01" min="0" value="' + (v117ValorComprado(item) || '') + '" placeholder="0,00" style="width:105px" oninput="v117AtualizarPreviewSaving()"></td>'
        + '<td style="padding:8px"><input class="v117-obs-neg" data-idx="' + idx + '" value="' + v117Escape(item.obsNegociacao || '') + '" placeholder="Motivo / detalhe" style="width:180px"></td>'
        + '<td style="padding:8px"><strong class="v117-saving-preview" data-idx="' + idx + '" style="color:#059669">' + v117FmtBRL(v117Saving(item)) + '</strong></td>'
        + '</tr>';
    }).join('');

    const header = isCotacao
      ? '<th>Item</th><th>Fornecedor cotado</th><th>Valor cotado</th><th>Observação da cotação</th>'
      : '<th>Item</th><th>Fornecedor cotado</th><th>Valor cotado</th><th>Fornecedor comprado</th><th>Valor comprado</th><th>Observação</th><th>Saving</th>';

    return '<div id="v117-saving-status" style="background:rgba(0,169,157,0.06);border:1px solid rgba(0,169,157,0.22);border-radius:12px;padding:16px;margin-bottom:14px">'
      + '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px">'
      + '<div><div style="font-family:Inter,sans-serif;font-weight:700;color:var(--accent2)">' + titulo + '</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:3px">' + ajuda + '</div></div>'
      + '<div id="v117-saving-total" style="font-size:12px;color:var(--muted);background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px">Total será calculado ao confirmar</div>'
      + '</div>'
      + '<div class="data-table-wrap"><table style="width:100%;font-size:13px"><thead><tr>' + header + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:10px">Os campos gerais de valor serão preenchidos automaticamente com a soma dos itens.</div>'
      + '</div>';
  }

  window.v117AtualizarPreviewSaving = function() {
    let totalCotado = 0;
    let totalComprado = 0;
    document.querySelectorAll('.v117-valor-cotado').forEach(el => totalCotado += v117Parse(el.value));
    document.querySelectorAll('.v117-valor-comprado').forEach(el => totalComprado += v117Parse(el.value));

    document.querySelectorAll('.v117-saving-preview').forEach(span => {
      const idx = span.dataset.idx;
      const cot = v117Parse(document.querySelector('.v117-valor-cotado[data-idx="' + idx + '"]')?.value);
      const cmp = v117Parse(document.querySelector('.v117-valor-comprado[data-idx="' + idx + '"]')?.value);
      const sv = cot - cmp;
      span.textContent = v117FmtBRL(sv);
      span.style.color = sv >= 0 ? '#059669' : '#dc2626';
    });

    const totalEl = document.getElementById('v117-saving-total');
    if (totalEl) {
      const saving = totalCotado - totalComprado;
      if (totalComprado) {
        totalEl.innerHTML = '<strong>Cotado:</strong> ' + v117FmtBRL(totalCotado) + ' · <strong>Comprado:</strong> ' + v117FmtBRL(totalComprado) + ' · <strong style="color:' + (saving >= 0 ? '#059669' : '#dc2626') + '">Saving: ' + v117FmtBRL(saving) + '</strong>';
      } else {
        totalEl.innerHTML = '<strong>Total cotado:</strong> ' + v117FmtBRL(totalCotado);
      }
    }
  };

  function v117InjectSavingStatus(next) {
    const sc = window._currentUpdateSC;
    const p = pedidos.find(x => x.sc === sc);
    const container = document.getElementById('status-extra-fields');
    if (!p || !container || !['Cotação','Pedido de Compra'].includes(next)) return;

    const oldV117 = document.getElementById('v117-saving-status');
    if (oldV117) oldV117.remove();
    const oldV116 = document.getElementById('saving-item-editor');
    if (oldV116) oldV116.remove();

    hideLegacyFinanceFields(next);

    const html = v117BuildStatusFinanceiro(p, next);
    container.insertAdjacentHTML('afterbegin', html);
    setTimeout(window.v117AtualizarPreviewSaving, 0);
  }

  function v117ApplyInputs(p) {
    if (!p || !Array.isArray(p.itens) || !document.getElementById('v117-saving-status')) return false;

    document.querySelectorAll('.v117-forn-cotado').forEach(el => {
      const item = p.itens[parseInt(el.dataset.idx, 10)];
      if (item) item.fornecedorCotado = el.value.trim();
    });
    document.querySelectorAll('.v117-valor-cotado').forEach(el => {
      const item = p.itens[parseInt(el.dataset.idx, 10)];
      if (item) item.valorCotadoItem = v117Parse(el.value);
    });
    document.querySelectorAll('.v117-forn-comprado').forEach(el => {
      const item = p.itens[parseInt(el.dataset.idx, 10)];
      if (item) item.fornecedorComprado = el.value.trim();
    });
    document.querySelectorAll('.v117-valor-comprado').forEach(el => {
      const item = p.itens[parseInt(el.dataset.idx, 10)];
      if (item) item.valorNegociadoItem = v117Parse(el.value);
    });
    document.querySelectorAll('.v117-obs-neg').forEach(el => {
      const item = p.itens[parseInt(el.dataset.idx, 10)];
      if (item) item.obsNegociacao = el.value.trim();
    });

    let totalCotado = 0;
    let totalComprado = 0;
    p.itens.forEach(item => {
      item.savingItem = v117Saving(item);
      totalCotado += v117ValorCotado(item);
      totalComprado += v117ValorComprado(item);
    });

    if (totalCotado > 0) p.valorCotacao = totalCotado;
    if (totalComprado > 0) p.valorPago = totalComprado;
    if (totalCotado > 0 && totalComprado > 0) p.saving = totalCotado - totalComprado;
    if (p.valorRef && totalComprado > 0) p.savingRef = v117Parse(p.valorRef) - totalComprado;

    const cot = document.getElementById('us-cotacao');
    const pago = document.getElementById('us-valorpago');
    const forn = document.getElementById('us-fornecedor');
    if (cot && totalCotado > 0) cot.value = String(totalCotado.toFixed(2));
    if (pago && totalComprado > 0) pago.value = String(totalComprado.toFixed(2));
    if (forn && p.itens[0] && p.itens[0].fornecedorCotado) forn.value = p.itens[0].fornecedorCotado;

    return true;
  }

  // Envolve o seletor de status mais uma vez, agora com injeção direta e atraso curto.
  if (typeof selectStatusOption === 'function' && !window._v117_selectStatusWrapped) {
    window._v117_selectStatusWrapped = true;
    const _previousSelectStatusOption = selectStatusOption;
    selectStatusOption = function(el, next) {
      const r = _previousSelectStatusOption.apply(this, arguments);
      setTimeout(() => v117InjectSavingStatus(next), 0);
      setTimeout(() => v117InjectSavingStatus(next), 80);
      return r;
    };
  }

  if (typeof confirmUpdateStatus === 'function' && !window._v117_confirmStatusWrapped) {
    window._v117_confirmStatusWrapped = true;
    const _previousConfirmUpdateStatus = confirmUpdateStatus;
    confirmUpdateStatus = function() {
      const sc = window._currentUpdateSC;
      const p = pedidos.find(x => x.sc === sc);
      if (p) v117ApplyInputs(p);
      return _previousConfirmUpdateStatus.apply(this, arguments);
    };
  }
})();

// =========================================================
// v1.1.8 — LOGIN UNIFICADO POR PERFIL
// =========================================================
// Um único botão/modal identifica automaticamente o perfil pela senha.

function updateUnifiedLoginButton() {
  const btn = document.getElementById('btn-login');
  const icon = document.getElementById('login-icon');
  const label = document.getElementById('login-label');
  if (!btn || !icon || !label) return;

  if (window.compradorMode) {
    btn.style.background = 'linear-gradient(135deg,#003a70,#005a9e)';
    btn.style.color = '#fff';
    btn.style.borderColor = '#003a70';
    icon.textContent = '🔓';
    label.textContent = 'Comprador Ativo';
    btn.title = 'Clique para sair';
  } else if (window.almoxarifeMode) {
    btn.style.background = 'linear-gradient(135deg,#7c3aed,#9333ea)';
    btn.style.color = '#fff';
    btn.style.borderColor = '#7c3aed';
    icon.textContent = '🔓';
    label.textContent = 'Almoxarife Ativo';
    btn.title = 'Clique para sair';
  } else {
    btn.style.background = 'transparent';
    btn.style.color = '#003a70';
    btn.style.borderColor = '#003a70';
    icon.textContent = '🔐';
    label.textContent = 'Login';
    btn.title = 'Entrar no sistema';
  }
}

function openLoginModal() {
  const overlay = document.getElementById('login-overlay');
  const input = document.getElementById('login-pwd-input');
  const error = document.getElementById('login-pwd-error');
  if (!overlay || !input || !error) return;
  input.value = '';
  error.textContent = '';
  input.style.borderColor = '#d1dbe8';
  overlay.style.display = 'flex';
  setTimeout(() => input.focus(), 100);
}

function closeLoginModal(clearPending = true) {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';
  if (clearPending) {
    window._pendingTab = null;
    window._pendingAlmoxTab = null;
  }
}

function enableCompradorMode() {
  window.compradorMode = true;
  window.almoxarifeMode = false;

  ['painel','config'].forEach(tab => {
    const btn = document.getElementById('nav-' + tab);
    if (!btn) return;
    btn.classList.remove('locked');
    btn.setAttribute('onclick', `switchTab('${tab}')`);
    const lock = btn.querySelector('.lock-icon');
    if (lock) lock.textContent = '';
  });

  const rec = document.getElementById('nav-recebimentos');
  if (rec) {
    rec.classList.remove('locked');
    rec.setAttribute('onclick', "switchTab('recebimentos')");
    const lock = rec.querySelector('.lock-icon');
    if (lock) lock.textContent = '';
  }

  const ld = document.getElementById('btn-lancamento-direto');
  if (ld) ld.style.display = 'flex';
  const btnKpiC = document.getElementById('btn-kpi-compras');
  if (btnKpiC) btnKpiC.style.display = '';

  updateUnifiedLoginButton();
  try { addRecebimentosNavAccess(); } catch(e) {}
  toast('✔ Login realizado como Comprador', 'success');
}

function enableAlmoxarifeMode() {
  window.almoxarifeMode = true;
  window.compradorMode = false;

  // Recebimentos liberado.
  const rec = document.getElementById('nav-recebimentos');
  if (rec) {
    rec.classList.remove('locked');
    rec.setAttribute('onclick', "switchTab('recebimentos')");
    const lock = rec.querySelector('.lock-icon');
    if (lock) lock.textContent = '';
  }

  // Painel liberado, mas somente na visão do Almoxarifado.
  const painel = document.getElementById('nav-painel');
  if (painel) {
    painel.classList.remove('locked');
    painel.setAttribute('onclick', "requireComprador('painel')");
    const lock = painel.querySelector('.lock-icon');
    if (lock) lock.textContent = '';
  }

  // Configuração continua restrita ao comprador.
  const config = document.getElementById('nav-config');
  if (config) {
    config.classList.add('locked');
    config.setAttribute('onclick', "requireComprador('config')");
    const lock = config.querySelector('.lock-icon');
    if (lock) lock.textContent = '🔒';
  }

  const ld = document.getElementById('btn-lancamento-direto');
  if (ld) ld.style.display = 'none';
  const btnKpiC = document.getElementById('btn-kpi-compras');
  if (btnKpiC) btnKpiC.style.display = 'none';

  updateUnifiedLoginButton();
  try { addRecebimentosNavAccess(); } catch(e) {}
  toast('✔ Login realizado como Almoxarife', 'success');
}

function logoutUnified() {
  const wasComprador = window.compradorMode;
  const wasAlmox = window.almoxarifeMode;
  window.compradorMode = false;
  window.almoxarifeMode = false;
  window._pendingTab = null;
  window._pendingAlmoxTab = null;

  ['painel','config'].forEach(tab => {
    const btn = document.getElementById('nav-' + tab);
    if (!btn) return;
    btn.classList.add('locked');
    btn.setAttribute('onclick', `requireComprador('${tab}')`);
    const lock = btn.querySelector('.lock-icon');
    if (lock) lock.textContent = '🔒';
  });

  const rec = document.getElementById('nav-recebimentos');
  if (rec) {
    rec.classList.add('locked');
    rec.setAttribute('onclick', "requireAlmoxarife('recebimentos')");
    const lock = rec.querySelector('.lock-icon');
    if (lock) lock.textContent = '🔒';
  }

  const ld = document.getElementById('btn-lancamento-direto');
  if (ld) ld.style.display = 'none';
  const btnKpiC = document.getElementById('btn-kpi-compras');
  if (btnKpiC) btnKpiC.style.display = '';

  const activePane = document.querySelector('.tab-pane.active');
  const restricted = ['painel','config','recebimentos'];
  if (activePane && restricted.includes(activePane.id.replace('tab-',''))) {
    switchTabDirect('solicitar');
  }

  updateUnifiedLoginButton();
  try { addRecebimentosNavAccess(); } catch(e) {}
  if (wasComprador || wasAlmox) toast('Sessão encerrada', 'success');
}

function toggleLogin() {
  if (window.compradorMode || window.almoxarifeMode) {
    logoutUnified();
  } else {
    openLoginModal();
  }
}

function checkUnifiedLogin() {
  const input = document.getElementById('login-pwd-input');
  const error = document.getElementById('login-pwd-error');
  if (!input || !error) return;
  const val = input.value;
  const pendingCompras = window._pendingTab;
  const pendingAlmox = window._pendingAlmoxTab;

  if (val === COMPRADOR_PASSWORD) {
    closeLoginModal(false);
    enableCompradorMode();
    window._pendingTab = null;
    window._pendingAlmoxTab = null;
    const destino = pendingCompras || pendingAlmox;
    if (destino) switchTabDirect(destino);
    return;
  }

  if (val === ALMOXARIFE_PASSWORD) {
    closeLoginModal(false);
    enableAlmoxarifeMode();
    window._pendingTab = null;
    window._pendingAlmoxTab = null;

    if (pendingAlmox) {
      switchTabDirect(pendingAlmox);
    } else if (pendingCompras === 'painel') {
      switchTabDirect('painel');
      setTimeout(() => {
        try { switchKPI('almox'); } catch(e) {}
        const btnC = document.getElementById('btn-kpi-compras');
        if (btnC) btnC.style.display = 'none';
      }, 50);
    } else if (pendingCompras) {
      toast('Este acesso é exclusivo do perfil Comprador.', 'error');
    }
    return;
  }

  error.textContent = 'Senha inválida. Verifique e tente novamente.';
  input.value = '';
  input.style.borderColor = '#dc2626';
  input.focus();
  setTimeout(() => input.style.borderColor = '#d1dbe8', 1200);
}

// As áreas bloqueadas agora usam o mesmo modal de login.
function requireComprador(tab) {
  if (window.compradorMode) { switchTab(tab); return; }
  if (window.almoxarifeMode && tab === 'painel') {
    switchTab('painel');
    setTimeout(() => {
      try { switchKPI('almox'); } catch(e) {}
      const btnCompras = document.getElementById('btn-kpi-compras');
      if (btnCompras) btnCompras.style.display = 'none';
    }, 50);
    return;
  }
  window._pendingTab = tab;
  window._pendingAlmoxTab = null;
  openLoginModal();
}

function requireAlmoxarife(tab) {
  if (window.almoxarifeMode || window.compradorMode) {
    switchTab(tab);
    return;
  }
  window._pendingAlmoxTab = tab;
  window._pendingTab = null;
  openLoginModal();
}

// Compatibilidade com chamadas antigas ainda existentes no arquivo.
function openPwdModal() { openLoginModal(); }
function closePwdModal() { closeLoginModal(); }
function checkPassword() { checkUnifiedLogin(); }
function toggleModoComprador() { toggleLogin(); }
function closeAlmPwdModal() { closeLoginModal(); }
function checkAlmoxarifePassword() { checkUnifiedLogin(); }
function toggleModoAlmoxarife() { toggleLogin(); }

// Garante o estado correto do botão ao carregar.
document.addEventListener('DOMContentLoaded', updateUnifiedLoginButton);


// =========================================================
// v1.2.0 — LOGIN INICIAL + AUTOCADASTRO DE SOLICITANTE
// =========================================================
const KV_AUTH_STORAGE = 'kv_auth_session_v120';
const KV_ROLE_STORAGE = 'kv_access_role_v120';
window.kvAuthUser = null;
window.kvAccessRole = null; // solicitante | comprador | almoxarife

function kvNormalizeSector(v) { return String(v || '').trim(); }

function kvDisplayNameFromEmail(email) {
  const local = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  if (!local) return 'Solicitante';
  return local.split(/\\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

function kvCurrentSector() {
  if (window.kvAccessRole !== 'solicitante') return '';
  return kvNormalizeSector(window.kvAuthUser?.user_metadata?.departamento || window.kvAuthUser?.user_metadata?.setor || '');
}

function kvIsVisiblePedido(p) {
  if (!p) return false;
  if (window.kvAccessRole === 'comprador' || window.kvAccessRole === 'almoxarife') return true;
  if (window.kvAccessRole !== 'solicitante') return false;
  return kvNormalizeSector(p.departamento).toLocaleLowerCase('pt-BR') === kvCurrentSector().toLocaleLowerCase('pt-BR');
}

function kvVisiblePedidos() { return (pedidos || []).filter(kvIsVisiblePedido); }

function showSignupView() {
  document.getElementById('auth-tab-login')?.classList.remove('active');
  document.getElementById('auth-tab-signup')?.classList.add('active');
  document.getElementById('auth-login-view').style.display = 'none';
  document.getElementById('auth-signup-view').style.display = '';
  document.getElementById('auth-signup-error').textContent = '';
  setTimeout(() => document.getElementById('signup-email')?.focus(), 50);
}

function showLoginView() {
  document.getElementById('auth-tab-signup')?.classList.remove('active');
  document.getElementById('auth-tab-login')?.classList.add('active');
  document.getElementById('auth-signup-view').style.display = 'none';
  document.getElementById('auth-login-view').style.display = '';
  document.getElementById('auth-login-error').textContent = '';
  setTimeout(() => document.getElementById('auth-user')?.focus(), 50);
}

function kvShowGate() {
  document.body.classList.add('auth-locked');
  document.getElementById('auth-gate')?.classList.remove('hidden');
  showLoginView();
}

function kvHideGate() {
  document.body.classList.remove('auth-locked');
  document.getElementById('auth-gate')?.classList.add('hidden');
}

function kvSaveSupabaseSession(payload) {
  if (!payload) return;
  const data = {
    access_token: payload.access_token || '',
    refresh_token: payload.refresh_token || '',
    expires_at: Math.floor(Date.now()/1000) + Number(payload.expires_in || 3600),
    user: payload.user || null
  };
  localStorage.setItem(KV_AUTH_STORAGE, JSON.stringify(data));
}

function kvClearSession() {
  localStorage.removeItem(KV_AUTH_STORAGE);
  sessionStorage.removeItem(KV_ROLE_STORAGE);
  window.kvAuthUser = null;
  window.kvAccessRole = null;
  window.compradorMode = false;
  window.almoxarifeMode = false;
}

async function kvAuthFetch(path, body, bearer) {
  const headers = {'Content-Type':'application/json','apikey':SUPA_KEY};
  if (bearer) headers.Authorization = 'Bearer ' + bearer;
  const res = await fetch(SUPA_URL + path, {method:'POST', headers, body: body ? JSON.stringify(body) : undefined});
  let data = {};
  try { data = await res.json(); } catch(e) {}
  if (!res.ok) {
    const msg = data?.msg || data?.message || data?.error_description || data?.error || ('HTTP ' + res.status);
    throw new Error(msg);
  }
  return data;
}

async function signupSolicitante() {
  const email = (document.getElementById('signup-email')?.value || '').trim().toLowerCase();
  const password = document.getElementById('signup-password')?.value || '';
  const setor = kvNormalizeSector(document.getElementById('signup-sector')?.value);
  const err = document.getElementById('auth-signup-error');
  err.textContent = '';
  if (!email || !email.includes('@')) { err.textContent = 'Informe um e-mail corporativo válido.'; return; }
  if (password.length < 6) { err.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
  if (!setor) { err.textContent = 'Selecione o seu setor.'; return; }

  try {
    const data = await kvAuthFetch('/auth/v1/signup', {
      email, password,
      data: { departamento: setor, setor: setor }
    });
    if (data.access_token && data.user) {
      kvSaveSupabaseSession(data);
      await kvEnterSolicitante(data.user);
      toast('✔ Cadastro realizado com sucesso!', 'success');
    } else {
      err.textContent = 'Cadastro criado. Se o Supabase solicitar confirmação de e-mail, confirme a mensagem recebida e depois faça o login.';
      document.getElementById('auth-user').value = email;
      document.getElementById('auth-password').value = '';
      setTimeout(showLoginView, 3500);
    }
  } catch(e) {
    const m = String(e.message || e);
    err.textContent = /already|registered|exists/i.test(m) ? 'Este e-mail já possui cadastro. Volte para o login.' : ('Não foi possível cadastrar: ' + m);
  }
}

async function loginFromGate() {
  const user = (document.getElementById('auth-user')?.value || '').trim();
  const password = document.getElementById('auth-password')?.value || '';
  const err = document.getElementById('auth-login-error');
  err.textContent = '';
  if (!user || !password) { err.textContent = 'Informe o usuário/e-mail e a senha.'; return; }

  const upper = user.toUpperCase();
  if (upper === 'COMPRADOR') {
    if (password !== COMPRADOR_PASSWORD) { err.textContent = 'Senha incorreta para COMPRADOR.'; return; }
    sessionStorage.setItem(KV_ROLE_STORAGE, 'comprador');
    await kvEnterInternalRole('comprador');
    return;
  }
  if (upper === 'ALMOXARIFE') {
    if (password !== ALMOXARIFE_PASSWORD) { err.textContent = 'Senha incorreta para ALMOXARIFE.'; return; }
    sessionStorage.setItem(KV_ROLE_STORAGE, 'almoxarife');
    await kvEnterInternalRole('almoxarife');
    return;
  }

  try {
    const data = await kvAuthFetch('/auth/v1/token?grant_type=password', {email:user.toLowerCase(), password});
    kvSaveSupabaseSession(data);
    await kvEnterSolicitante(data.user);
  } catch(e) {
    err.textContent = 'E-mail ou senha inválidos. Se acabou de se cadastrar, verifique se o e-mail precisa ser confirmado.';
  }
}

async function kvEnterSolicitante(user) {
  const setor = kvNormalizeSector(user?.user_metadata?.departamento || user?.user_metadata?.setor);
  if (!setor) throw new Error('Seu cadastro não possui setor definido.');
  window.kvAuthUser = user;
  window.kvAccessRole = 'solicitante';
  window.compradorMode = false;
  window.almoxarifeMode = false;
  sessionStorage.removeItem(KV_ROLE_STORAGE);
  kvHideGate();
  kvConfigureNavigationForRole();
  kvApplySolicitanteIdentity();
  await dbLoad();
  renderPedidosTable();
  renderProgramadasTable();
  updateUnifiedLoginButton();
}

async function kvEnterInternalRole(role) {
  window.kvAuthUser = null;
  window.kvAccessRole = role;
  kvHideGate();
  if (role === 'comprador') enableCompradorMode();
  else enableAlmoxarifeMode();
  kvConfigureNavigationForRole();
  await dbLoad();
  renderPedidosTable();
  renderProgramadasTable();
  updateUnifiedLoginButton();
}

function kvConfigureNavigationForRole() {
  const isSolic = window.kvAccessRole === 'solicitante';

  // Abas que todos os perfis podem visualizar.
  ['nav-solicitar','nav-programadas','nav-pedidos'].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.style.display = '';
  });

  const restritas = ['nav-recebimentos','nav-painel','nav-config'];

  if (isSolic) {
    // Para o solicitante, não faz sentido exibir áreas às quais ele não tem acesso.
    restritas.forEach(id => {
      const b = document.getElementById(id);
      if (b) b.style.display = 'none';
    });
    const ld = document.getElementById('btn-lancamento-direto');
    if (ld) ld.style.display = 'none';
    return;
  }

  // Ao entrar como Comprador ou Almoxarife, restaura as abas antes de aplicar
  // as permissões específicas de cada perfil.
  restritas.forEach(id => {
    const b = document.getElementById(id);
    if (b) b.style.display = '';
  });
}

function kvRestrictedForSolicitante(tab) {
  toast('Esta área é exclusiva dos perfis Comprador/Almoxarife.', 'error');
}

function kvApplySolicitanteIdentity() {
  if (window.kvAccessRole !== 'solicitante' || !window.kvAuthUser) return;
  const email = window.kvAuthUser.email || '';
  const setor = kvCurrentSector();
  const nome = kvDisplayNameFromEmail(email);
  const sol = document.getElementById('f-solicitante');
  const dep = document.getElementById('f-depto');
  if (sol) { sol.value = nome; sol.readOnly = true; sol.title = email; sol.style.background='rgba(0,58,112,.04)'; }
  if (dep) { dep.value = setor; dep.disabled = true; dep.style.background='rgba(0,58,112,.04)'; }
}

// Sobrescreve o carregamento: sem login não carrega dados; solicitante recebe apenas o próprio setor.
async function dbLoad() {
  if (!window.kvAccessRole) { pedidos = []; return true; }
  try {
    let url = SUPA_URL + '/rest/v1/pedidos?select=*&order=created_at.desc';
    if (window.kvAccessRole === 'solicitante') {
      const setor = kvCurrentSector();
      url += '&departamento=eq.' + encodeURIComponent(setor);
    }
    const res = await fetch(url, { headers: SUPA_HEADERS });
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + await res.text());
    pedidos = (await res.json() || []).map(fromDB);
    updateExcelBadge(pedidos.length);
    return true;
  } catch(e) {
    console.error('Supabase load error:', e.message);
    const el=document.getElementById('excelStatus');
    if(el){el.className='excel-badge disconnected';el.innerHTML='<div class="dot"></div><span>Erro: '+e.message+'</span>';}
    return false;
  }
}

// Garante que um solicitante não abra, nem por chamada manual, pedido de outro setor.
const _kvOpenModalOriginal = openModal;
openModal = function(sc) {
  const p = pedidos.find(x => x.sc === sc);
  if (window.kvAccessRole === 'solicitante' && !kvIsVisiblePedido(p)) { toast('Você não tem acesso a este pedido.', 'error'); return; }
  return _kvOpenModalOriginal(sc);
};

// Busca do acompanhamento também respeita o setor.
searchOrders = function() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const container = document.getElementById('search-results');
  if (!container) return;
  if (!q) { container.innerHTML=''; return; }
  const results = kvVisiblePedidos().filter(p =>
    (p.sc||'').toLowerCase().includes(q) ||
    (p.solicitante||'').toLowerCase().includes(q) ||
    (p.itens||[]).some(i => (i.descricao||'').toLowerCase().includes(q)) ||
    (p.fornecedorSug||'').toLowerCase().includes(q)
  );
  if (!results.length) { container.innerHTML='<div class="empty-state"><div class="icon">🔍</div><h3>Nenhum pedido encontrado</h3><p>Tente outro termo de busca</p></div>'; return; }
  container.innerHTML = results.map(p => `
    <div class="order-card" onclick="openModal('${p.sc}')">
      <div class="order-card-header"><div><div style="display:flex;align-items:center;gap:8px"><div class="order-id">${p.sc}</div></div>
      <div style="font-size:12px;color:var(--muted);margin-top:3px">${p.solicitante||'Solicitante'} · ${p.departamento||'—'}</div></div>
      <span class="status-badge status-${statusKey(p.status)}">${p.status}</span></div>
      <div class="order-meta"><div class="order-meta-item"><strong>Empresa:</strong> ${p.empresa||'—'}</div><div class="order-meta-item"><strong>Itens:</strong> ${(p.itens||[]).length}</div></div>
    </div>`).join('');
};

// Tabelas: como dbLoad já traz apenas o setor do solicitante, mantemos as funções existentes,
// mas filtramos novamente para proteção de interface caso algum dado seja inserido em memória.
const _kvRenderPedidosTableOriginal = renderPedidosTable;
renderPedidosTable = function() {
  if (window.kvAccessRole !== 'solicitante') return _kvRenderPedidosTableOriginal();
  const all = pedidos;
  pedidos = all.filter(kvIsVisiblePedido);
  try { return _kvRenderPedidosTableOriginal(); } finally { pedidos = all; }
};

const _kvRenderProgramadasTableOriginal = renderProgramadasTable;
renderProgramadasTable = function() {
  if (window.kvAccessRole !== 'solicitante') return _kvRenderProgramadasTableOriginal();
  const all = pedidos;
  pedidos = all.filter(kvIsVisiblePedido);
  try { return _kvRenderProgramadasTableOriginal(); } finally { pedidos = all; }
};

// Mantém a identificação do solicitante após limpar o formulário.
const _kvClearFormOriginal = clearForm;
clearForm = function() {
  _kvClearFormOriginal();
  kvApplySolicitanteIdentity();
};

// Para solicitantes, força setor/solicitante da sessão no momento do envio.
const _kvSubmitSolicitacaoOriginal = submitSolicitacao;
submitSolicitacao = function() {
  if (window.kvAccessRole === 'solicitante') kvApplySolicitanteIdentity();
  return _kvSubmitSolicitacaoOriginal();
};

// Botão superior passa a representar a sessão atual e funciona como logout.
updateUnifiedLoginButton = function() {
  const btn=document.getElementById('btn-login'), icon=document.getElementById('login-icon'), label=document.getElementById('login-label');
  if(!btn||!icon||!label) return;
  btn.style.background = window.kvAccessRole ? 'rgba(0,58,112,.08)' : 'transparent';
  btn.style.color='#003a70'; btn.style.borderColor='#003a70'; icon.textContent=window.kvAccessRole?'👤':'🔐';
  if(window.kvAccessRole==='comprador') label.textContent='COMPRADOR · Sair';
  else if(window.kvAccessRole==='almoxarife') label.textContent='ALMOXARIFE · Sair';
  else if(window.kvAccessRole==='solicitante') label.textContent=kvDisplayNameFromEmail(window.kvAuthUser?.email)+' · Sair';
  else label.textContent='Login';
  label.classList.add('auth-user-chip');
  btn.title=window.kvAccessRole?'Clique para sair':'Entrar no sistema';
};

async function kvLogout() {
  try {
    const raw=localStorage.getItem(KV_AUTH_STORAGE);
    if(raw){ const s=JSON.parse(raw); if(s.access_token) await kvAuthFetch('/auth/v1/logout', null, s.access_token); }
  } catch(e) {}
  kvClearSession();
  pedidos=[];
  kvShowGate();
  updateUnifiedLoginButton();
}

toggleLogin = function() {
  if (window.kvAccessRole) kvLogout();
  else kvShowGate();
};

// Perfis internos continuam com as senhas atuais, mas agora exigem também o usuário.
checkUnifiedLogin = function() { kvShowGate(); };
openLoginModal = function() { kvShowGate(); };

requireComprador = function(tab) {
  if (window.kvAccessRole === 'comprador' || window.compradorMode) { switchTab(tab); return; }
  if (window.kvAccessRole === 'almoxarife' && tab === 'painel') { switchTab('painel'); setTimeout(()=>{try{switchKPI('almox')}catch(e){}},50); return; }
  toast('Acesso exclusivo do perfil Comprador.', 'error');
};

requireAlmoxarife = function(tab) {
  if (window.kvAccessRole === 'almoxarife' || window.kvAccessRole === 'comprador') { switchTab(tab); return; }
  toast('Acesso exclusivo dos perfis Almoxarife/Comprador.', 'error');
};

async function kvRestoreSession() {
  const role=sessionStorage.getItem(KV_ROLE_STORAGE);
  if(role==='comprador' || role==='almoxarife') { await kvEnterInternalRole(role); return true; }
  const raw=localStorage.getItem(KV_AUTH_STORAGE);
  if(!raw) return false;
  try {
    let s=JSON.parse(raw);
    if(!s.user) throw new Error('Sessão inválida');
    if(s.expires_at && s.expires_at <= Math.floor(Date.now()/1000)+30 && s.refresh_token) {
      const refreshed=await kvAuthFetch('/auth/v1/token?grant_type=refresh_token',{refresh_token:s.refresh_token});
      kvSaveSupabaseSession(refreshed); s=JSON.parse(localStorage.getItem(KV_AUTH_STORAGE));
    }
    await kvEnterSolicitante(s.user); return true;
  } catch(e) {
    localStorage.removeItem(KV_AUTH_STORAGE); return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // O app permanece bloqueado até existir uma sessão válida.
  const ok = await kvRestoreSession();
  if(!ok) kvShowGate();
});


// v1.2.10 — controle horizontal persistente da tabela de negociação
function scrollSavingItemTable(value) {
  const wrap = document.querySelector('#saving-item-editor .data-table-wrap');
  if (!wrap) return;
  const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
  wrap.scrollLeft = max * (Number(value || 0) / 1000);
}

function syncSavingItemScrollControl() {
  const wrap = document.querySelector('#saving-item-editor .data-table-wrap');
  const range = document.querySelector('#saving-item-editor .saving-scroll-range');
  if (!wrap || !range || wrap.dataset.scrollSyncBound === '1') return;
  wrap.dataset.scrollSyncBound = '1';
  wrap.addEventListener('scroll', function () {
    const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
    range.value = max ? Math.round((wrap.scrollLeft / max) * 1000) : 0;
  }, {passive:true});
}

const kvSavingScrollObserver = new MutationObserver(function(){
  if (document.getElementById('saving-item-editor')) syncSavingItemScrollControl();
});
if (document.body) kvSavingScrollObserver.observe(document.body,{childList:true,subtree:true});

// =========================================================
// v1.2.15 — SC GLOBAL / EVITA DUPLICIDADE ENTRE SOLICITANTES
// O contador antigo usava localStorage, que é local a cada navegador.
// Agora a próxima SC é calculada a partir das SCs existentes no Supabase
// e o INSERT só entra na tela depois de confirmado pelo banco.
// =========================================================
async function kvGetNextSC() {
  const year = new Date().getFullYear();
  try {
    const res = await fetch(SUPA_URL + '/rest/v1/pedidos?select=sc&order=created_at.desc', { headers: SUPA_HEADERS });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    let max = 0;
    (rows || []).forEach(r => {
      const m = String(r.sc || '').match(new RegExp('^SC-' + year + '-(\\d+)$'));
      if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
    });
    return `SC-${year}-${String(max + 1).padStart(3, '0')}`;
  } catch (e) {
    console.error('Erro ao calcular próxima SC:', e);
    const localMax = pedidos.reduce((max, p) => {
      const m = String(p.sc || '').match(new RegExp('^SC-' + year + '-(\\d+)$'));
      return m ? Math.max(max, parseInt(m[1], 10) || 0) : max;
    }, 0);
    return `SC-${year}-${String(localMax + 1).padStart(3, '0')}`;
  }
}

async function kvInsertPedidoSeguro(pedido) {
  // Em caso de dois usuários enviarem exatamente ao mesmo tempo,
  // recalcula a SC e tenta novamente sem criar pedido fantasma na tela.
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    pedido.sc = await kvGetNextSC();
    const res = await fetch(SUPA_URL + '/rest/v1/pedidos', {
      method: 'POST',
      headers: { ...SUPA_HEADERS, 'Prefer': 'return=representation' },
      body: JSON.stringify(toDB(pedido))
    });
    if (res.ok) {
      const salvo = await res.json().catch(() => []);
      return { ok: true, pedido: salvo && salvo[0] ? normalizePedidoItems(fromDB(salvo[0])) : pedido };
    }
    const txt = await res.text();
    let code = '';
    try { code = JSON.parse(txt).code || ''; } catch (_) {}
    if (res.status === 409 || code === '23505') continue;
    return { ok: false, erro: txt };
  }
  return { ok: false, erro: 'Não foi possível reservar um número de solicitação após várias tentativas.' };
}

submitSolicitacao = async function() {
  if (window.kvAccessRole === 'solicitante') kvApplySolicitanteIdentity();

  const empresa = document.getElementById('f-empresa').value;
  const solicitante = document.getElementById('f-solicitante').value.trim();
  const depto = document.getElementById('f-depto').value;
  const prioridade = document.getElementById('f-prioridade').value;
  const necessidade = document.getElementById('f-necessidade').value;
  const justificativa = document.getElementById('f-justificativa').value.trim();
  const rows = document.querySelectorAll('#items-body .item-row');
  const items = [];
  rows.forEach(r => {
    const inputs = r.querySelectorAll('input, select');
    const desc = inputs[0].value.trim();
    if (desc) items.push(normalizeItem({ descricao: desc, unidade: inputs[1].value, qtd: inputs[2].value || '1', ref: inputs[3].value, qtdRecebida: 0, statusItem: 'Pendente', recebimentos: [] }));
  });

  if (!empresa || !solicitante || !depto || !prioridade || !necessidade || !justificativa) {
    toast('Preencha todos os campos obrigatórios (*)', 'error'); return;
  }
  if (items.length === 0) { toast('Adicione pelo menos um item à solicitação', 'error'); return; }

  const btn = document.querySelector('[onclick="submitSolicitacao()"]');
  const oldText = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = 'Salvando...'; }

  try {
    const novoPedido = normalizePedidoItems({
      sc: '', empresa, data: document.getElementById('f-data').value, solicitante, departamento: depto, prioridade,
      necessidade, tipo: document.getElementById('f-tipo').value, itens: items,
      fornecedorSug: document.getElementById('f-fornecedor').value, linkProduto: document.getElementById('f-link').value,
      valorRef: parseFloat(document.getElementById('f-valref').value)||0, justificativa,
      aprovador: document.getElementById('f-aprovador').value, obs: document.getElementById('f-obs').value,
      status: 'Solicitado', dataCriacao: new Date().toISOString(), docNFE: ''
    });

    const resultado = await kvInsertPedidoSeguro(novoPedido);
    if (!resultado.ok) {
      console.error('Falha ao salvar solicitação:', resultado.erro);
      toast('Não foi possível salvar a solicitação. Nenhum pedido foi criado. Tente novamente.', 'error');
      return;
    }

    const salvo = resultado.pedido;
    pedidos = pedidos.filter(p => p.sc !== salvo.sc);
    pedidos.unshift(salvo);
    toast(`✔ Solicitação ${salvo.sc} registrada com sucesso!`, 'success');
    clearForm();
    document.getElementById('f-sc').value = await kvGetNextSC();
    addItemRow();
    renderPedidosTable();
    renderProgramadasTable();
    renderDashboard();
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = oldText; }
  }
};

// Atualiza o número sugerido após cada carga do banco.
const _kvDbLoadV1215 = dbLoad;
dbLoad = async function() {
  const ok = await _kvDbLoadV1215();
  const scEl = document.getElementById('f-sc');
  if (scEl) scEl.value = await kvGetNextSC();
  return ok;
};
