# 6. Perfis de Acesso

## 6.1 Perfis

| Perfil | Acesso | Telas |
|--------|--------|-------|
| **Motorista** | Coleta, Entrega, Rota do Dia | Dashboard, Rota, Coleta, Entrega, Almoxarifado |
| **Lavagem** | F2 (etapas 4-6) | Dashboard (Lavagem), Kanban, Detalhes |
| **Secagem** | F3 (etapas 7-9) | Dashboard (Secagem), Kanban, Detalhes |
| **Expedição** | F1 (etapas 2-3) + F4 (etapas 10-12) | Dashboard (Expedição), Kanban, Detalhes, Almoxarifado |
| **Admin (backoffice)** | Todas | Todas |

## 6.2 Controle de Acesso

Implementado via JWT:

```typescript
interface JwtPayload {
  id: number;
  nome: string;
  perfil: 'motorista' | 'lavagem' | 'secagem' | 'expedicao' | 'admin';
  transportadorId?: number; // se for motorista
  iat: number;
  exp: number;
}
```

O backend verifica o perfil antes de permitir ações:

```typescript
// middleware/perfil.middleware.ts
export function requirePerfil(...perfis: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !perfis.includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Sem permissão para esta ação' },
      });
    }
    next();
  };
}
```

## 6.3 Ações por Perfil

| Ação | Motorista | Lavagem | Secagem | Expedição | Admin |
|------|-----------|---------|---------|-----------|-------|
| Ver rota do dia | ✅ | ❌ | ❌ | ❌ | ✅ |
| Coletar tapete | ✅ | ❌ | ❌ | ❌ | ✅ |
| Entregar tapete | ✅ | ❌ | ❌ | ❌ | ✅ |
| Iniciar lavagem | ❌ | ✅ | ❌ | ❌ | ✅ |
| Iniciar secagem | ❌ | ❌ | ✅ | ❌ | ✅ |
| Inspecionar | ❌ | ❌ | ❌ | ✅ | ✅ |
| Embalar | ❌ | ❌ | ❌ | ✅ | ✅ |
| Avançar qualquer etapa | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver kanban completo | ✅ | ✅ | ✅ | ✅ | ✅ |
| Carregar no veículo | ✅ | ❌ | ❌ | ✅ | ✅ |

## 6.4 Fluxo de Trabalho do Motorista

```mermaid
flowchart TD
    A[Motorista loga no app] --> B[App exibe lista de coletas do dia]
    B --> C[Motorista solicita rota otimizada]
    C --> D[Backend consulta RouteXL]
    D --> E[App exibe mapa com rota]
    E --> F[Motorista percorre rota]
    F --> G[Em cada parada: confirma coleta]
    G --> H[App atualiza status no backend]
    H --> I[Após todas as coletas: retorna à base]
    I --> J[Motorista marca serviços como "carregados"]
    J --> K[App exibe lista de devoluções]
    K --> L[Motorista percorre rota de devolução]
    L --> M[Em cada parada: confirma entrega + assinatura]
    M --> N[App atualiza status para "devolvido"]
```

## 6.5 Fluxo de Trabalho da Equipe Interna

```mermaid
flowchart TD
    A[Pedido chega na lavanderia] --> B[Status: Coletado]
    B --> C[Lavagem: atualiza para "Em Lavagem"]
    C --> D[Lavagem: atualiza para "Higienizado"]
    D --> E[Lavagem: atualiza para "Centrifugado"]
    E --> F[Secagem: atualiza para "Estendido"]
    F --> G[Secagem: atualiza para "Em Estufa"]
    G --> H[Secagem: atualiza para "Escovado"]
    H --> I[Expedição: atualiza para "Inspeção Final"]
    I --> J[Expedição: atualiza para "Embalado"]
    J --> K[Expedição: atualiza para "Devolução"]
```
