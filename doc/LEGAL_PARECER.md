# ⚖️ Parecer Jurídico — umarizal.app

> **Agente:** CLOGPT — Chief Legal Officer (Fase 3, #15)
> **Status:** ✅ Parecer emitido em 2026-08-10
> **Natureza:** análise de exposição jurídica de aplicativo de **uso interno** da Lavanderia Umarizal

## 1. Objeto

O aplicativo `umarizal.app` é ferramenta interna de logística e produção (controle de tapetes), utilizada por colaboradores (motorista, expedição, lavagem, secagem e administração). Não há exposição pública de dados — o único endpoint público existente é o calendário de eventos (`/api/public/calendario-ics`) usado para agenda.

## 2. Dados tratados (visão jurídica)

| Dado | Titular | Natureza |
|------|---------|----------|
| Nome, e-mail, senha | Colaboradores | Dados pessoais (funcionários) |
| Nome, telefone, e-mail, CPF/CNPJ, endereço, coordenadas | Clientes | Dados pessoais e dados pessoais sensíveis¹ |
| Assinatura digital (coleta/entrega) | Clientes | Dado pessoal com valor probatório |
| Fotos do tapete e do ambiente | Clientes | Dado pessoal (imagem de domicílio) |
| Geolocalização (aceite por IP, endereço de serviço) | Clientes | Dado pessoal |

¹ CPF pode configurar dado pessoal sensível conforme interpretação consolidada (ANPD) quando usado para identificação unívoca.

## 3. Riscos identificados

| # | Risco | Probabilidade | Impacto | Mitigação recomendada |
|---|-------|---------------|---------|----------------------|
| R1 | **Assinatura digital** com valor probatório questionado | Média | Alto | Manter registro de data/hora/autor (já existe `dataColetaRealizada`/`dataEntregaRealizada`); conservar armazenamento íntegro |
| R2 | Fotos de ambientes internos do cliente | Média | Médio | Acesso restrito aos perfis necessários; reter pelo tempo do serviço + garantia |
| R3 | Acesso de colaborador a dados além da função (CPF, telefone, valores) | Média | Médio | RBAC já implementado (valores ocultos fora do admin — F36/B20); revisar visibilidade de CPF/telefone por perfil |
| R4 | Ausência de política de retenção e eliminação | Alta (prazo indefinido) | Médio | Definir prazos (seção LGPD) e rotina de eliminação |
| R5 | Incidente de segurança (vazamento) | Baixa | Alto | Já mitigado: JWT com secret em produção, SecureStore, HTTPS, rate limiting |

## 4. Conclusão

**Exposição: BAIXA a MÉDIA.** O app é de uso interno, sem compartilhamento com terceiros, com medidas de segurança adequadas ao porte (RBAC, criptografia de token, HTTPS). Os pontos que exigem ação são **documentais** (política de retenção, aviso de privacidade, termo de consentimento) e de **governança** (nomeação de encarregado) — todos de baixo custo e sem impacto funcional no app.

## 5. Recomendações (priorizadas)

1. Adotar o **Aviso de Privacidade** (ContractGPT) e exibi-lo no painel admin (ou no 1º login do app)
2. Adotar o **Termo de Autorização de Assinatura Digital** (ContractGPT) — no contrato de prestação de serviço
3. Aplicar o **checklist de conformidade** (ComplianceGPT) com plano de ação
4. Nomear encarregado (DPO) — pode ser o proprietário; registrar e-mail de contato

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · CLOGPT — parecer jurídico -->
