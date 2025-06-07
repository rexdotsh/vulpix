The battle system uses a reactive data architecture with Convex providing real-time updates and optimistic UI patterns.

```mermaid
graph LR
    subgraph "Frontend State"
        PP["PolkadotProvider"] --> SA["selectedAccount"]
        SA --> QP["Query Parameters"]
        LS["Local State"] --> UI["UI Components"]
    end
    
    subgraph "Convex Integration"
        QP --> CQ["Convex Queries"]
        UI --> CM["Convex Mutations"]
        CQ --> RT["Real-time Updates"]
        CM --> OPT["Optimistic Updates"]
    end
    
    subgraph "Navigation Flow"
        UI --> NR["Next.js Router"]
        NR --> RP["Route Push"]
        RP --> LBP["/battle/lobby/{id}"]
        RP --> BPP["/battle/play/{id}"]
    end
```

### Navigation Patterns

The battle system uses predictable URL patterns for different battle states:

| Route Pattern | Purpose | Trigger |
|---------------|---------|---------|
| `/battle` | Main arena hub | Navigation, redirects |
| `/battle/lobby/{lobbyId}` | Lobby preparation | Create/join lobby |
| `/battle/play/{battleId}` | Active battle | Battle start, continue |

Navigation occurs through `router.push()` calls after successful mutations, providing immediate feedback and state transitions.