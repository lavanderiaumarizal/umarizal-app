# 🔒 LGPD — Mapa de Dados, Retenção e Direitos (umarizal.app)

> **Agente:** LGPDGPT — Proteção de Dados e Privacidade (Fase 3, #16)
> **Status:** ✅ Mapa elaborado em 2026-08-10
> **Base legal:** Lei 13.709/2018 (LGPD)

## 1. Papéis

| Papel | Entidade |
|-------|----------|
| **Controladora** | Lavanderia Umarizal (define finalidades) |
| **Operadores** | Colaboradores que acessam o app (motorista, expedição, produção, admin) |
| **Encarregado (DPO)** | A nomear — recomendado: proprietário da lavanderia (e-mail de contato a registrar) |

## 2. Mapa de Dados

| Dado | Onde fica | Finalidade | Base legal (art. 7º) | Retenção sugerida |
|------|-----------|------------|----------------------|-------------------|
| Nome/e-mail/senha de colaborador | `Usuario` (bcrypt) | Acesso ao sistema | Execução de contrato de trabalho (VII) | Enquanto vínculo + 5 anos |
| Nome, telefone, e-mail, CPF/CNPJ do cliente | `Cliente` | Prestação de serviço e contato | Execução de contrato (V) | Enquanto relação comercial + 5 anos (art. 12 CDC) |
| Endereço e coordenadas | `Cliente`, `Orcamento` | Coleta/entrega (logística) | Execução de contrato (V) / legítimo interesse (IX) | Enquanto contrato vigente + 5 anos |
| **Assinatura digital** (coleta/entrega) | `Orcamento` (URL) | Comprovação da execução do serviço | Execução de contrato (V) + consentimento (I) | **5 anos** (prazo prescricional) |
| Fotos de tapetes/ambiente | `Orcamento.fotos*`, `OrcamentoFoto` | Documentação e controle de qualidade | Execução de contrato (V) / legítimo interesse (IX) | Enquanto serviço + garantia (recomendado 1 ano pós-entrega) |
| Geolocalização do aceite (IP) | `Orcamento` (latitude/longitude) | Prova de aprovação do orçamento | Legítimo interesse (IX) | 5 anos |

## 3. Medidas de segurança já implementadas (verificadas)

- ✅ Token JWT em **SecureStore** (Keychain/EncryptedSharedPreferences) — não em AsyncStorage
- ✅ Senhas com **bcrypt** (`Usuario.senha`)
- ✅ **HTTPS** obrigatório (`https://api.lavanderiaumarizal.com.br`)
- ✅ **Rate limiting** (login 10/min; app 60/min)
- ✅ **RBAC multi-perfil** — valores financeiros ocultos para não-admin (F36/B20)
- ✅ `.env` fora do versionamento (sem segredos em commits)
- ⚠️ A revisar: visibilidade de **CPF/telefone** de clientes por perfil (hoje expedição/motorista veem dados necessários à execução — manter apenas o necessário, princípio da minimização)

## 4. Direitos do titular (art. 18) — como atender

| Direito | Como atender no sistema atual |
|---------|------------------------------|
| Confirmação e acesso | Painel admin → orçamentos/clientes |
| Correção | Painel admin → edição de cliente/orçamento |
| Anonimização/eliminação | Bloqueio manual via banco (não há UI dedicada) |
| Portabilidade | Exportação manual (relatórios) |
| Revogação de consentimento | Termo de assinatura digital documenta a base |

> **Recomendação:** registrar em procedimento interno como o titular solicita (e-mail/WhatsApp da lavanderia) e quem atende (encarregado).

## 5. Registro de operações (art. 37)

Recomendado manter um **registro simples de operações** (quem acessou o quê). O sistema já registra `historicoFases`, `coletorId` e `dataColetaRealizada` — cobrir também acessos de consulta se o porte justificar.

<!-- Créditos: RepoCreditsAdderGPT — documentação padronizada · LGPDGPT — proteção de dados -->
