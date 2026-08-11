# 🏛️ Checklist de Conformidade LGPD — umarizal.app

> **Agente:** ComplianceGPT — Conformidade Regulatória (Fase 3, #18)
> **Status:** ✅ Checklist elaborado em 2026-08-10
> **Objetivo:** adequação da Lavanderia Umarizal ao usar o app interno que processa dados de clientes

## Checklist

| # | Item LGPD | Situação | Evidência / Ação |
|---|-----------|----------|------------------|
| 1 | Base legal definida para cada tratamento | ✅ Em conformidade | Execução de contrato (art. 7º, V) + legítimo interesse (IX) — mapa em `LEGAL_LGPD.md` |
| 2 | Consentimento para assinatura digital | ⚠️ Adotar termo | Minuta em `LEGAL_CONSENTIMENTO.md` (item 2) |
| 3 | Aviso de privacidade aos titulares | ⚠️ Adotar aviso | Minuta em `LEGAL_CONSENTIMENTO.md` (item 1) — exibir no painel admin |
| 4 | Medidas de segurança adequadas | ✅ Em conformidade | SecureStore, bcrypt, HTTPS, rate limiting, RBAC (verificado no código) |
| 5 | Minimização de dados (acesso por perfil) | ⚠️ Revisar CPF/telefone | Valores financeiros já ocultos (F36/B20); revisar visibilidade de CPF por perfil |
| 6 | Política de retenção e eliminação | ⚠️ Definir rotina | Prazos em `LEGAL_LGPD.md` (5 anos; fotos 1 ano pós-entrega); registrar procedimento de eliminação |
| 7 | Encarregado (DPO) nomeado | ⚠️ Nomear | Recomendado: proprietário; registrar e-mail de contato |
| 8 | Direitos do titular atendidos | ✅ Atendíveis | Acesso/correção via painel admin; procedimento de solicitação a documentar |
| 9 | Registro de operações | ⚠️ Complementar | Já há `historicoFases`/`coletorId`; adicionar registro de consultas se porte justificar |
| 10 | Comunicação de incidentes | ⚠️ Procedimento | Definir fluxo: detectar → conter → notificar ANPD/titulares (art. 48) |
| 11 | Segredos fora do código | ✅ Em conformidade | `.env` fora do git; nenhum segredo em commits (auditado na Fase 1) |
| 12 | Dados de menores | ✅ Não aplicável | Serviço B2C residencial; se houver atendimento a menores, exigir responsável |

## Plano de ação (priorizado)

| Prioridade | Ação | Esforço | Onde |
|------------|------|---------|------|
| 1 | Adotar termo de autorização de assinatura digital | Baixo | Contrato de serviço (documento) |
| 2 | Adotar aviso de privacidade no painel admin | Baixo | Painel admin — tela simples |
| 3 | Nomear encarregado e registrar contato | Baixo | Documento interno |
| 4 | Definir prazos de retenção + rotina de eliminação | Baixo | Procedimento interno |
| 5 | Revisar visibilidade de CPF por perfil | Médio | Backend (B20) + painel |
| 6 | Procedimento de resposta a incidentes | Médio | Documento interno |

> **Observação:** as ações 1–4 são documentais/organizacionais (sem código). As ações 5–6 podem ser tratadas em sprint futura, após Q1–Q8.

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · ComplianceGPT — conformidade regulatória -->
