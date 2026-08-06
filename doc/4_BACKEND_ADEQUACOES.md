# 4. Adequações no Backend

## 4.1 Novas Tabelas no Banco

### `etapas_producao`

```prisma
model EtapaProducao {
  id          Int       @id @default(autoincrement())
  orcamentoId String    @map("orcamento_id")
  etapa       Int       // 1 a 12
  nome        String
  status      String    @default("pendente") // pendente | em_andamento | concluida
  responsavel String?
  concluidoEm DateTime? @map("concluido_em")
  observacoes String?

  orcamento Orcamento @relation(fields: [orcamentoId], references: [id])

  @@unique([orcamentoId, etapa])
  @@map("etapas_producao")
}
```

### `carregamento_veiculo`

```prisma
model CarregamentoVeiculo {
  id          String   @id @default(uuid())
  orcamentoId String   @unique @map("orcamento_id")
  carregadoEm DateTime @default(now()) @map("carregado_em")
  usuarioId   Int      @map("usuario_id")
  veiculo     String   @default("principal") // principal | reserva

  orcamento Orcamento @relation(fields: [orcamentoId], references: [id])
  usuario   Usuario   @relation(fields: [usuarioId], references: [id])

  @@map("carregamento_veiculo")
}
```

## 4.2 Novos Endpoints

### Autenticação Unificada — Login com `rememberMe`

O mesmo endpoint serve painel admin e app mobile:

```
POST /api/auth/login
Body: { email, senha, rememberMe?: boolean }
Response: { token, usuario: { id, nome, email, nivel, perfis, transportadorId?, veiculo? } }

- Sem rememberMe (padrão): token de 3 dias (painel admin)
- Com rememberMe: true: token de 30 dias (app mobile)
- Se o perfil incluir 'motorista' e houver transportador vinculado:
  retorna transportadorId e placaVeiculo
```

### Gerenciamento de Etapas

```
GET  /api/etapas/:orcamentoId
Response: { etapa_1: "concluida", etapa_2: "pendente", ... }

POST /api/etapas/:orcamentoId/iniciar     (B5)
Body: { etapa: number, responsavel: string }
Response: { success, data: { ..., status: "em_andamento" } }

POST /api/etapas/:orcamentoId/concluir    (B6)
Body: { etapa: number, responsavel: string, observacoes?: string }
Response: { success, data: { ..., status: "concluida", faseSincronizada, faseAtual } }

POST /api/etapas/:orcamentoId/retornar    (B7)
Body: { etapa: number, motivo: string }
Response: { success, data: { ..., status: "pendente" } }
```

### Coleta e Entrega

```
POST /api/orcamentos/:id/coleta-realizada
Body: { fotos: string[], assinatura: string, observacoes?: string }
Response: { success }

POST /api/orcamentos/:id/entrega-realizada  
Body: { assinatura: string, observacoes?: string, fotos?: string[] }
Response: { success }
```

### Carregamento no Veículo

```
POST /api/orcamentos/:id/carregar
Body: { veiculo?: string }
Response: { success, carregadoEm }

DELETE /api/orcamentos/:id/carregar
Response: { success }  // Remove flag de carregado
```

### Rota do Dia — Consumida pelo App

Os endpoints do RouteXL já existem no backend e serão consumidos pelo app:

| Método | Endpoint | Uso no App |
|--------|----------|------------|
| `GET` | `/api/routexl/status` | Verificar se RouteXL está configurado |
| `POST` | `/api/routexl/optimize` | Gerar/otimizar rota com as paradas do dia |
| `POST` | `/api/routexl/save-route` | Salvar rota otimizada no banco |
| `GET` | `/api/routexl/rota-do-dia?data=YYYY-MM-DD` | Carregar rota salva para uma data |
| `GET` | `/api/routexl/rotas?dataInicio=...&dataFim=...` | Listar rotas em um período |
| `GET` | `/api/routexl/geocode?address=...` | Geocodificar endereço (se necessário) |

**Atenção:** Atualmente as rotas do RouteXL exigem autenticação de admin (`router.use(authenticate)`). Para o app de motorista será necessário:

1. Criar um novo arquivo de rotas `routexl.motorista.routes.ts` com autenticação do motorista (não admin)
2. Ou modificar o middleware existente para aceitar motoristas (usando `requirePerfil('motorista')`)
3. A rota `POST /api/routexl/enviar-confirmacoes` DEVE permanecer admin-only (dispara WhatsApp para clientes)

### Status de Coleta/Entrega na Rota

Para que a parada seja desabilitada na rota após a conclusão, o app consulta o status do orçamento:

```
GET /api/orcamentos/:id/status
Response: { faseAtual: "F1_COLETADO", status: "COLETADO", ... }
```

Se o orçamento já estiver em `F1_COLETADO` ou `ENTREGUE`, a parada correspondente na rota deve aparecer como concluída/desabilitada.

## 4.3 Modelo de Usuário (Motorista)

O backend já tem a model `Transportador`. Será necessário:

1. Adicionar campo `cpf` e `senha` à tabela `transportadores`
2. Ou criar uma tabela `usuarios_motoristas` separada

**Recomendação:** Reutilizar a tabela `usuarios` existente (que já tem email, senha, nível), adicionando:

```prisma
model Usuario {
  // ... campos existentes
  transportador Transportador? // relação 1:1 existente
}
```

E criar um nível `motorista` no enum de permissões.

## 4.4 Webhooks e Notificações

- Quando uma etapa é concluída → notificação push (opcional)
- Quando a rota do dia é gerada → notificação para o motorista
- Quando o tapete está pronto para entrega → notificação para expedição

## 4.5 Rate Limiting

O app fará muitas requisições em paralelo. O backend já tem rate limiter implementado (`rateLimiter.ts`), mas é importante garantir que não bloqueie o app. Ajustar limites se necessário para:

- 60 requisições/minuto por IP (para o app)
- 10 requisições/minuto para rotas de login

## 4.6 Integração com RouteXL (detalhes da API)

Baseado na pesquisa complementar e na documentação oficial do RouteXL:

### Endpoints da API RouteXL

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/status` | GET | Verifica status da API e limite de localizações disponível |
| `/api/distances` | POST | Retorna matriz de distâncias entre localizações |
| `/api/tour` | POST | Retorna rota otimizada com ordem das paradas |

### Autenticação

Basic Auth com username/password do plano RouteXL.

### Exemplo de requisição para `/api/tour`

```json
{
  "locations": [
    {"address": "Lavanderia Umarizal - Base", "lat": -23.5882, "lng": -46.6387},
    {"address": "Cliente A", "lat": -23.5505, "lng": -46.6333},
    {"address": "Cliente B", "lat": -23.5605, "lng": -46.6433}
  ]
}
```

### Limitações do plano gratuito

- Máximo de **10 localizações por requisição** (incluindo origem e destino).
- Acima disso, é necessário upgrade para plano pago.
- O backend atual já consome esta API e armazena as rotas geradas.

### Fluxo de integração no app

1. **App solicita**: `GET /api/routexl/rotas?data=YYYY-MM-DD`
2. **Backend verifica**: se já existe rota salva para a data, retorna direto
3. **Se não existe**: backend coleta endereços dos orçamentos do dia, chama RouteXL, salva e retorna
4. **App exibe**: lista ordenada de paradas + mapa com a rota

### Cache

O backend já implementa cache (Redis). Rotas do dia são cacheadas por 1 hora ou até que um novo orçamento seja adicionado à data.
