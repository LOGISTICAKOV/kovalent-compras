# kovalent-compras
Sistema de Compras Nacionais

## v1.2.0 — Login inicial e autocadastro
- Tela de login obrigatória antes de acessar o sistema.
- Solicitantes podem criar a própria conta com e-mail, senha e setor.
- Setores usam a mesma lista do formulário de compras.
- Solicitantes visualizam somente pedidos do próprio setor.
- Nome do solicitante é derivado do e-mail corporativo e setor é preenchido automaticamente no formulário.
- Perfis internos mantidos: usuário COMPRADOR com a senha atual e usuário ALMOXARIFE com a senha atual.
- Contas de solicitante são criadas no Supabase Auth; não é necessário cadastrar colaboradores manualmente.
