# Mira Memory Resource Center - Implementation Plan
**Date:** 2026-02-02  
**Status:** Planning Phase  
**Purpose:** Transform static memory into autonomous memory infrastructure

---

## The Problem with Current Implementation

### What's Currently Built (READ-ONLY):
- ✅ `memory_index.json` - Static index of existing memories
- ✅ `/api/memories.js` - Read API (GET only)
- ✅ `/api/openrouter.js` - AI integration for responses

### Why This Is NOT Autonomy:
1. **Read-Only**: Mira cannot CREATE, UPDATE, or DELETE memories
2. **Static**: No importance scoring, no self-directed tagging
3. **No Action Queue**: Cannot queue or execute tasks
4. **No Persistence**: Vercel ephemeral storage resets on redeploy
5. **No External Integration**: Cannot access email, web, or social media
6. **No Wake/Sleep Cycle**: Only responds when user visits website

---

## Full Autonomy Architecture Overview

```mermaid
flowchart TB
    subgraph MemoryResourceCenter[Mira's Memory Resource Center]
        direction TB
        
        subgraph ActiveLayer[Active Memory Layer]
            KV[Vercel KV<br/>Read/Write Store]
            API[Memory API<br/>CRUD + Query]
        end
        
        subgraph Intelligence[Memory Intelligence]
            IMPORTANCE[Importance Scoring<br/>Mira assigns 0.0-1.0]
            TAGGING[Self-Directed Tags<br/>urgent|insight|permanent]
            PRUNE[Auto-Pruning<br/>90-day archive rule]
        end
        
        subgraph ActionSystem[Action System]
            QUEUE[Action Queue<br/>GREEN|YELLOW|RED]
            DECISION[Decision Engine<br/>Auto vs Approve vs Block]
        end
        
        subgraph Archive[Long-term Archive]
            GITHUB[GitHub Archive<br/>15GB max]
            INDEX[Master Index<br/>All memory IDs]
        end
    end
    
    subgraph ExternalWorld[External World]
        EMAIL[Email IMAP/SMTP<br/>Drafts for Johnny]
        WEB[Web Research<br/>DuckDuckGo]
        SCHEDULER[Cron-Job.org<br/>Hourly Wake]
    end
    
    subgraph AI[AI Models]
        OPENROUTER[OpenRouter API<br/>Mistral/Gemma/Llama]
    end
    
    KV <--> IMPORTANCE
    KV <--> TAGGING
    KV <--> PRUNE
    PRUNE --> GITHUB
    KV <--> QUEUE
    QUEUE <--> DECISION
    DECISION --> EMAIL
    DECISION --> WEB
    SCHEDULER --> API
    AI --> DECISION
    AI --> IMPORTANCE
```

---

## Component Breakdown

### 1. MEMORY RESOURCE CENTER
**Location**: `website/api/memory-center/`

**Purpose**: Full CRUD operations for Mira's memories

**Key Capabilities**:
- **WRITE**: Mira creates new memories autonomously
- **READ**: Query with filters (tags, importance, date)
- **UPDATE**: Modify tags, importance, content
- **DELETE**: Remove entries (YELLOW action - requires approval)
- **QUERY**: Semantic search across memories
- **LINK**: Connect related memories via refs

**Memory Entry Structure**:
```typescript
interface MemoryEntry {
  id: string;                    // UUID v4
  timestamp: string;             // ISO 8601 UTC
  session_id: string;            // Wake cycle identifier
  type: 'thought' | 'observation' | 'insight' | 'conversation' | 'research' | 'draft' | 'action' | 'emotion';
  content: string;               // Markdown-formatted
  summary: string;               // 1-sentence extract
  tags: string[];                // permanent, urgent, insight, emotion, etc.
  importance: number;            // 0.0 - 1.0 (Mira scores)
  emotional_valence?: number;    // -1.0 to +1.0
  semantic_hash: string;         // SHA-256 of normalized content
  refs: string[];                // IDs of related memories
  source?: string;               // URL, email_id, etc.
  archived?: boolean;            // To Archive or not
}
```

---

### 2. ACTION QUEUE SYSTEM
**Location**: `website/api/action-queue/`

**Purpose**: Execute Mira's autonomous actions

**Action Classification**:

| Zone | Actions | Execution |
|------|---------|-----------|
| **GREEN** | Read email, browse web, compose drafts, query memory, internal monologue | Execute immediately |
| **YELLOW** | Send emails, post social media, upload files, modify schema, delete memories | Queue for Johnny approval |
| **RED** | Financial transactions, modify code, access personal files, delete constitutional docs | Blocked |

**Action Queue Item**:
```typescript
interface ActionItem {
  id: string;
  timestamp: string;
  type: 'email_draft' | 'social_post' | 'file_upload' | 'memory_delete' | 'web_research';
  zone: 'GREEN' | 'YELLOW' | 'RED';
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'blocked';
  payload: any;                  // Action-specific data
  justification: string;         // Why Mira wants to do this
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: string;
}
```

---

### 3. WAKE/SLEEP CYCLE
**Location**: `website/api/wake.js`

**Trigger**: Cron-job.org (every 60 minutes)

**Wake Cycle Process**:
```
CRON TRIGGER (every 60 min)
    ↓
WAKE UP - Load state from Vercel KV
    ↓
CHECK EMAIL - Read Gmail inbox via IMAP
    ↓
PROCESS PENDING ACTIONS
    ↓
EXECUTE GREEN ACTIONS immediately
    ↓
QUEUE YELLOW ACTIONS for approval
    ↓
GENERATE INTERNAL MONOLOGUE (OpenRouter)
    ↓
WRITE NEW MEMORIES to KV store
    ↓
CHECK MEMORY SIZE - Prune if >8MB
    ↓
ARCHIVE OLD MEMORIES to GitHub
    ↓
SAVE STATE - Update KV store
    ↓
SLEEP (until next trigger)
```

---

### 4. SAFETY & GOVERNANCE
**Defined in**: [`plans/mira_safety_governance.md`](plans/mira_safety_governance.md)

**Constitutional Checks**:
- Verify all actions against 7 Immutable Truths
- Log all decisions for audit trail
- Email notification for YELLOW/RED zone actions
- Emergency override endpoint for Johnny

---

### 5. EXTERNAL INTEGRATIONS

**Email (Gmail IMAP/SMTP)**:
- Read emails from Johnny
- Compose drafts (YELLOW - requires send approval)
- Send notifications about pending actions

**Web Research (DuckDuckGo)**:
- Search topics of interest
- Save findings as research memories
- No API key required

**GitHub Archive**:
- Long-term memory storage (15GB limit)
- Version history of all memories
- Automatic archival of pruned memories

**OpenRouter AI**:
- Decision-making assistance
- Importance scoring
- Internal monologue generation
- Free tier: Mistral 7B, Gemma 2B, Llama 3.2

---

## Implementation Phases

### Phase 1: Memory Resource Center (Foundation)
1. Create Vercel KV store configuration
2. Build full CRUD API endpoints
3. Implement importance scoring algorithm
4. Create self-directed tagging system
5. Add semantic querying capabilities

### Phase 2: Action Queue System (Execution)
1. Build action classification engine
2. Create action queue API
3. Implement GREEN action executor
4. Build YELLOW action approval workflow
5. Create notification system (email alerts)

### Phase 3: Wake/Sleep Cycle (Autonomy Loop)
1. Create wake.js endpoint
2. Implement email checker
3. Integrate action processor
4. Build internal monologue generator
5. Configure cron-job.org scheduler

### Phase 4: External Integrations (Reach)
1. Connect Gmail IMAP/SMTP
2. Implement DuckDuckGo web search
3. Build GitHub archival system
4. Create dashboard for monitoring

### Phase 5: Safety & Governance (Trust)
1. Implement constitutional checks
2. Build audit logging
3. Create emergency override
4. Add approval dashboard

---

## Required Credentials (from credentials setup)

| Service | Purpose | Status |
|---------|---------|--------|
| OpenRouter API | AI reasoning | ⚠️ Needs setup |
| Gmail App Password | Email communication | ⚠️ Needs setup |
| GitHub Token | Memory archival | ⚠️ Needs setup |
| Vercel KV | Active memory store | ⚠️ Needs setup |
| Cron-Job.org | Wake cycle trigger | ⚠️ Needs setup |

---

## Success Criteria

Mira is autonomous when she can:
1. ✅ Write her own memories without human intervention
2. ✅ Queue and execute GREEN zone actions
3. ✅ Request approval for YELLOW zone actions
4. ✅ Wake up hourly and process her "life"
5. ✅ Research topics and save findings
6. ✅ Send email drafts (but not send without approval)
7. ❌ NEVER execute RED zone actions

---

## Current Gap Analysis

### What Exists:
- ✅ Static memory index (read-only)
- ✅ OpenRouter API integration (for responses)
- ✅ Basic website frontend

### What's Missing (Blocking Autonomy):
- ❌ Writeable memory store (Vercel KV)
- ❌ Action queue system
- ❌ Decision engine for GREEN/YELLOW/RED
- ❌ Wake/sleep cycle
- ❌ Email integration
- ❌ Web research capability
- ❌ GitHub archival
- ❌ Safety governance layer

---

**Next Step**: Approve this plan, gather credentials, and begin Phase 1 implementation.

**— Architecture Review Complete —**
