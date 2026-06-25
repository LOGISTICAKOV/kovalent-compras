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
      + '<div class="kpi-label">🧪 Caixas Amostradas</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#ec4899">' + cxMes + '</div>'
      + '<div class="kpi-sub">' + subLabel + '</div></div>'

      + '<div class="kpi-card" style="border-color:rgba(236,72,153,0.2)">'
      + '<div class="kpi-label">🧪 Itens Amostrados</div>'
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
      + '<div class="kpi-label">🧪 Média — Cx. Amostradas</div>'
      + '<div class="kpi-value" style="font-size:22px;color:#ec4899">' + mediaCx + '</div>'
      + '<div class="kpi-sub">por mês (' + nMeses + ' mês' + (nMeses!==1?'es':'') + ' com dados)</div></div>'

      + '<div class="kpi-card" style="background:rgba(236,72,153,0.04);border-color:rgba(236,72,153,0.15)">'
      + '<div class="kpi-label">🧪 Média — Itens Amostrados</div>'
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
          if (tab === 'painel') renderDashboard();
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
    { label:'Finalizado',                      icon:'✅', status: stepStatus(p.status, 'Finalizado'),                           date: p.dataFinalizado||'',     note: p.recebidoPor ? `Por: ${p.recebidoPor}` : '' },
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
        ${showAmostra ? '<th style="padding:8px; text-align:left; color:#ec4899; font-weight:700">🧪 Itens Amostrados</th>' : ''}
      </tr></thead>
      <tbody>${itensHtml}</tbody>
    </table>

    <div class="card-title"><span>🗺</span> Acompanhamento</div>
    <div class="timeline">${tlHtml}</div>

    ${p.justificativa ? `<div style="margin-top:20px; background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:6px">JUSTIFICATIVA</div><div style="font-size:13px">${p.justificativa}</div></div>` : ''}
    ${p.obs ? `<div style="margin-top:12px; background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:6px">OBSERVAÇÕES</div><div style="font-size:13px">${p.obs}</div></div>` : ''}

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

  } else if (next === 'Lançar NF') {
    extraFields = '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">📅 Data de Entrega *</label>'
      + '<input type="date" id="us-datareceb" value="' + new Date().toISOString().split('T')[0] + '" style="width:100%">'
      + '</div>'
      + '<div class="form-group" style="margin-bottom:14px">'
      + '<label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.8px">🧾 Nota Fiscal de Entrada *</label>'
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

function confirmUpdateStatus() {
  const sc   = window._currentUpdateSC;
  const next = window._currentUpdateNext;
  if (!sc || !next) { toast('Selecione um status', 'error'); return; }
  const p = pedidos.find(x => x.sc === sc);
  if (!p) return;
  const today = new Date().toISOString().split('T')[0];

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
    if (!nfe) { toast('Informe o número da Nota Fiscal', 'error'); return; }
    p.docNFE          = nfe;
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

  } else if (next === 'Aguardando Retirada do Estoque') {
    p.dataAguardandoRet = document.getElementById('us-dataretirada')?.value || today;
    if (!p.dataAguardandoRet) { toast('Informe a data de retirada', 'error'); return; }

  } else if (next === 'Finalizado') {
    p.dataFinalizado = today;

  } else if (next === 'Cancelado') {
    p.dataCancelado = today;
  }

  const obs = document.getElementById('us-obs')?.value;
  if (obs) p.obs = (p.obs ? p.obs + ' | ' : '') + '[' + next + '] ' + obs;

  p.status = next;
  dbUpdate(p);
  toast('✔ Status atualizado para: ' + next, 'success');
  openModal(sc);
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
    <div class="kpi-card"><div class="kpi-label">Total de Pedidos</div><div class="kpi-value accent">${total}</div><div class="kpi-sub">desde o início</div></div>
    <div class="kpi-card"><div class="kpi-label">Em Aberto</div><div class="kpi-value info">${emAberto}</div><div class="kpi-sub">aguardando</div></div>
    <div class="kpi-card"><div class="kpi-label">Atrasados</div><div class="kpi-value ${atrasados>0?'danger':'accent'}">${atrasados}</div><div class="kpi-sub">acima da data necessidade</div></div>
    <div class="kpi-card"><div class="kpi-label">Lead Time Médio</div><div class="kpi-value warn">${avgLead}</div><div class="kpi-sub">dias (da solicitação à entrega)</div></div>
    <div class="kpi-card" style="border-color:rgba(251,146,60,0.3)" onclick="openNFDetalhe()" title="Clique para ver pedidos pendentes">
      <div class="kpi-label">🧾 Tempo Médio — Lançar NF</div>
      <div class="kpi-value" style="color:#fb923c">${avgNF}</div>
      <div class="kpi-sub" style="display:flex;justify-content:space-between">
        <span>dias pendente no status</span>
        ${pendentesNF > 0 ? '<span style="color:#fb923c;font-weight:600;cursor:pointer">'+pendentesNF+' pendente'+(pendentesNF>1?'s':'')+'</span>' : ''}
      </div>
    </div>
    <div class="kpi-card" style="border-color:rgba(5,150,105,0.25);cursor:${taxaNoPrazo!==null?'pointer':'default'}" onclick="${taxaNoPrazo!==null?'openTaxaPrazoModal()':''}" title="${taxaNoPrazo!==null?'Clique para ver detalhes':''}">
      <div class="kpi-label">✅ Taxa no Prazo</div>
      <div class="kpi-value" style="font-size:28px;color:${taxaColor}">${taxaNoPrazo !== null ? taxaNoPrazo + '%' : '—'}</div>
      <div class="kpi-sub" style="display:flex;justify-content:space-between;align-items:center">
        <span>${pedidosConcluidos.length} pedido${pedidosConcluidos.length!==1?'s':''} analisado${pedidosConcluidos.length!==1?'s':''}</span>
        ${taxaNoPrazo !== null ? '<span style="color:'+taxaColor+';font-weight:600;font-size:11px">'+pedidosNoPrazo.length+' no prazo</span>' : ''}
      </div>
    </div>
  `;

  // financial KPI row
  const finGrid = document.getElementById('kpi-fin-grid');
  if (finGrid) {
    finGrid.innerHTML = `
      <div class="kpi-card" style="border-color:rgba(0,198,167,0.2)">
        <div class="kpi-label">💰 Total Comprado</div>
        <div class="kpi-value accent" style="font-size:22px">${fmtBRL(totalPago)}</div>
        <div class="kpi-sub">soma dos valores pagos</div>
      </div>

      <div class="kpi-card" style="border-color:rgba(16,185,129,0.3);background:rgba(16,185,129,0.04)">
        <div class="kpi-label">📉 Saving (Cotação → Pago)</div>
        <div class="kpi-value" style="font-size:22px;color:#34d399">${fmtBRL(totalSaving)}</div>
        <div class="kpi-sub" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
          <span>${fmtPct(savingPct)} de economia sobre cotação</span>
          ${totalSaving > 0 ? `<button onclick="openSavingModal('cotacao')" style="background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);color:#34d399;border-radius:6px;padding:3px 10px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;white-space:nowrap" onmouseover="this.style.background='rgba(52,211,153,0.25)'" onmouseout="this.style.background='rgba(52,211,153,0.15)'">Ver pedidos →</button>` : ''}
        </div>
      </div>
      <div class="kpi-card" style="border-color:rgba(96,165,250,0.2)">
        <div class="kpi-label">🎯 Saving (Ref. → Pago)</div>
        <div class="kpi-value info" style="font-size:22px">${savingRef > 0 ? fmtBRL(savingRef) : '—'}</div>
        <div class="kpi-sub" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
          <span>${savingRef > 0 ? fmtPct(savingRefPct) + ' sobre referência' : 'Aguardando dados'}</span>
          ${savingRef > 0 ? `<button onclick="openSavingModal('ref')" style="background:rgba(96,165,250,0.15);border:1px solid rgba(96,165,250,0.3);color:#60a5fa;border-radius:6px;padding:3px 10px;font-size:11px;font-family:'DM Sans',sans-serif;cursor:pointer;white-space:nowrap" onmouseover="this.style.background='rgba(96,165,250,0.25)'" onmouseout="this.style.background='rgba(96,165,250,0.15)'">Ver pedidos →</button>` : ''}
        </div>
      </div>
    `;
  }

  const statusColors = { 'Solicitado':'#6b7d99', 'Cotação':'#f59e0b', 'Pedido de Compra':'#4ade80', 'Aguardando Pagamento':'#c084fc', 'A Caminho':'#60a5fa', 'Recebimento Parcial':'#d97706', 'Lançar NF':'#fb923c', 'Conferência':'#0ea5e9', 'Aguardando Identificação':'#a855f7', 'Amostragem':'#ec4899', 'Aguardando Retirada do Estoque':'#f59e0b', 'Finalizado':'#34d399', 'Cancelado':'#f87171' };
  document.getElementById('status-bars').innerHTML = Object.entries(statusColors).map(([st,col]) => {
    const count = byStatus[st]||0;
    const pct = total ? Math.round(count/total*100) : 0;
    return `<div class="bar-row"><span style="font-size:13px">${st}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div><span class="bar-count">${count}</span></div>`;
  }).join('');

  const priorities = ['Urgente','Alta','Média','Baixa'];
  const priColors = {'Urgente':'#ec4899','Alta':'#ef4444','Média':'#f59e0b','Baixa':'#6b7d99'};
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
  document.getElementById('painel-title').textContent = view === 'compras' ? 'KPI Compras' : 'KPI Almoxarifado';
  if (view === 'almox' && !window.compradorMode && window.almoxarifeMode) {
    const btnC = document.getElementById('btn-kpi-compras');
    if (btnC) btnC.style.display = 'none';
  }
  document.getElementById('painel-sub').textContent   = view === 'compras'
    ? 'Indicadores de desempenho das compras nacionais'
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
      + '<div class="kpi-label">🧪 Caixas Amostradas</div>'
      + '<div class="kpi-value" style="font-size:26px;color:#ec4899">' + totalAmoCxMes + '</div>'
      + '<div class="kpi-sub" style="display:flex;justify-content:space-between">'
      + '<span>este mês</span><span style="color:var(--muted)">total: ' + totalAmoCx + '</span></div></div>'

      + '<div class="kpi-card" style="border-color:rgba(236,72,153,0.2)">'
      + '<div class="kpi-label">🧪 Itens Amostrados</div>'
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
  const allBtn = document.querySelector('.status-filter-btn[data-status=""]');

  if (status === '') {
    // "Todos" clicked — clear all, activate only Todos
    document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  } else {
    // deactivate "Todos"
    allBtn.classList.remove('active');
    btn.classList.toggle('active');
    // if nothing selected, re-activate Todos
    const anyActive = [...document.querySelectorAll('.status-filter-btn.active')].some(b => b.dataset.status !== '');
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
    { label:'Recebimento Parcial', icon:'📦', status: stepStatus(p.status, 'Recebimento Parcial'), date: p.dataLancarNF ? formatDate(p.dataLancarNF) : '', note: pedidoTemRecebimento(p) ? 'Há itens recebidos parcialmente' : '' },
    { label:'Lançar NF', icon:'🧾', status: stepStatus(p.status, 'Lançar NF'), date: p.dataLancarNF||'', note: p.docNFE ? `NF(s): ${p.docNFE}` : '' },
    { label:'Conferência', icon:'🔍', status: stepStatus(p.status, 'Conferência'), date: p.dataConferencia ? formatDate(p.dataConferencia) : '', note: '' },
    { label:'Aguardando Identificação', icon:'🏷️', status: stepStatus(p.status, 'Aguardando Identificação'), date: p.dataAguardandoId ? formatDate(p.dataAguardandoId) : '', note: '' },
    { label:'Amostragem', icon:'🧪', status: stepStatus(p.status, 'Amostragem'), date: p.dataAmostragem ? formatDate(p.dataAmostragem) : '', note: '' },
    { label:'Aguardando Retirada do Estoque', icon:'📤', status: stepStatus(p.status, 'Aguardando Retirada do Estoque'), date: p.dataAguardandoRet ? formatDate(p.dataAguardandoRet) : '', note: '' },
    { label:'Finalizado', icon:'✅', status: stepStatus(p.status, 'Finalizado'), date: p.dataFinalizado||'', note: p.recebidoPor ? `Por: ${p.recebidoPor}` : '' },
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
    ${p.obs ? `<div style="margin-top:12px; background:var(--surface2); border-radius:10px; padding:14px"><div style="font-size:11px; color:var(--muted); margin-bottom:6px">OBSERVAÇÕES</div><div style="font-size:13px">${escapeHTML(p.obs)}</div></div>` : ''}
  `;

  document.getElementById('modal-content').innerHTML +=
    '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">'
    + (canEdit ? '<button class="btn btn-secondary" onclick="updateStatus(\'' + p.sc + '\')">🔄 Atualizar Status</button>' : window.almoxarifeMode ? '<span style="font-size:12px;color:#a855f7;display:flex;align-items:center;gap:6px">📦 Almoxarife só pode atualizar a partir de Lançar NF</span>' : '<span style="font-size:12px;color:#6b7f96;display:flex;align-items:center;gap:6px">🔒 Apenas compradores podem atualizar o status</span>')
    + (canReceber ? '<button class="btn btn-primary" onclick="openRecebimentoModal(\'' + p.sc + '\')">📦 Registrar Recebimento</button>' : '')
    + (window.compradorMode ? '<button class="btn btn-secondary" onclick="openEditModal(\'' + p.sc + '\')">Editar</button>' : '')
    + (window.compradorMode ? '<button class="btn btn-danger" onclick="confirmarExclusao(\'' + p.sc + '\')">Excluir</button>' : '')
    + '<button class="btn btn-secondary" onclick="closeModal()">Fechar</button>'
    + '</div>';
  document.getElementById('modal-overlay').classList.add('open');
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
    + '<td style="padding:8px"><input type="number" class="rec-qtd" data-idx="'+idx+'" min="0" max="'+saldo+'" step="0.01" placeholder="0" style="width:90px"></td>'
    + '</tr>').join('');

  document.getElementById('modal-content').innerHTML =
    '<div class="modal-header"><div><div style="font-family:Inter,sans-serif;font-size:20px;font-weight:700">📦 Registrar Recebimento</div>'
    + '<div style="color:var(--muted);font-size:13px;margin-top:4px">'+escapeHTML(sc)+' · informe a NF e a quantidade recebida por item</div></div>'
    + '<button class="modal-close" onclick="openModal(\''+sc+'\')">✕</button></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">'
    + '<div><label>NF de Entrada *</label><input id="rec-nf" type="text" placeholder="Ex: 123456" style="width:100%"></div>'
    + '<div><label>Data de Recebimento *</label><input id="rec-data" type="date" value="'+today+'" style="width:100%"></div>'
    + '<div><label>Recebido por</label><input id="rec-por" type="text" placeholder="Nome" style="width:100%"></div>'
    + '</div>'
    + '<div class="data-table-wrap" style="margin-bottom:16px"><table style="width:100%;font-size:13px"><thead><tr><th>Item</th><th>Qtd.</th><th>Já Recebido</th><th>Receber agora</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    + '<div style="margin-bottom:16px"><label>Observação</label><textarea id="rec-obs" placeholder="Opcional" style="width:100%;min-height:60px"></textarea></div>'
    + '<div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn btn-secondary" onclick="openModal(\''+sc+'\')">Cancelar</button><button class="btn btn-primary" onclick="confirmRecebimento(\''+sc+'\')">Salvar Recebimento</button></div>';
  document.getElementById('modal-overlay').classList.add('open');
}

async function confirmRecebimento(sc) {
  const p = normalizePedidoItems(pedidos.find(x => x.sc === sc));
  if (!p) return;
  const nf = document.getElementById('rec-nf')?.value?.trim();
  const data = document.getElementById('rec-data')?.value;
  const recebidoPor = document.getElementById('rec-por')?.value?.trim();
  const obs = document.getElementById('rec-obs')?.value?.trim();
  if (!nf) { toast('Informe o número da NF de entrada.', 'error'); return; }
  if (!data) { toast('Informe a data de recebimento.', 'error'); return; }

  let totalLinhas = 0;
  let erroQtd = '';
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
    item.recebimentos.push({ nf, data, qtd, recebidoPor, obs, criadoEm: new Date().toISOString() });
    normalizeItem(item);
    totalLinhas++;
  });
  if (erroQtd) { toast(erroQtd, 'error'); return; }
  if (!totalLinhas) { toast('Informe quantidade recebida para ao menos um item.', 'error'); return; }

  recalcPedidoRecebimento(p);
  p.dataRecebimento = data;
  if (recebidoPor) p.recebidoPor = recebidoPor;
  if (obs) p.obs = (p.obs ? p.obs + ' | ' : '') + '[Recebimento NF '+nf+'] ' + obs;

  await dbUpdate(p);
  toast('Recebimento registrado para NF ' + nf, 'success');
  openModal(sc);
  renderPedidosTable();
  renderDashboard();
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
