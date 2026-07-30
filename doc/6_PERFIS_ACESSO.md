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
