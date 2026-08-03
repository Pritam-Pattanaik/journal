# UI/UX Design Specification & Interface Audit
**TradeVault Platform — Institutional Design System & Interaction Standards**  
**Document ID:** SPEC-UIUX-2026-008  
**Category:** User Experience & Interface Design  
**Date Created:** 2026-08-03  
**Status:** Approved  
**Author:** Product Architect & UX Lead  
**Target UX Score:** 9.8/10

---

## 1. Executive Summary & Design Aesthetics

TradeVault is built for professional and active retail traders who demand speed, visual clarity, data density, and zero distractions. The interface utilizes a curated dark-mode palette, subtle glassmorphic accents, and instant micro-interactions inspired by Linear, Bloomberg Terminal, and Claude.

---

## 2. Interface Audit & Flaw Inventory

| Component | Current Defect | Impact | Target V2 Specification |
|-----------|----------------|--------|-------------------------|
| **News Filter Pills** | Dead UI; no filtering applied to mapped list | High | Instant client-side filtering by category with count badges |
| **Delete Session** | Native browser `confirm()` modal | High | Custom dark glassmorphic `ConfirmModal` with 5s Undo Toast |
| **Session Rename** | Modal dialog popup | Medium | Click-to-edit inline input (`Enter` to save, `Esc` to cancel) |
| **Session Restore** | Mounts to blank empty state on refresh | High | Auto-restore `lastActiveConversationId` from localStorage |
| **Context Synced** | Static text; no true synchronization check | Medium | Real-time status indicator: `87 Trades • 30 Journals • Market: Live` |
| **Feedback Buttons** | ThumbsUp/Down have no onClick handlers | Medium | Immediate visual feedback (+1 popover) + backend persistence |
| **Interactive Cards** | `<div onClick>` lacks `role="button"` | Medium | Full keyboard accessibility (`tabIndex={0}`, `Enter` key support) |

---

## 3. AI Coach V2 Workspace Layout & Design

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Mode: General | Pre-Market | Post-Market | Trade | Journal | ...]    │
├────────────────────────────────────────────────────────────────────────┤
│ 🟢 Context Synced: 87 Trades • 30 Journals • Live Market: NIFTY 24,850 │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   [User Query Bubble] ─────────────────────────────────────────────►   │
│                                                                        │
│   ◄───────────────────────── [AI Mentor Bubble with Structured Data]   │
│   [👍 Helpful] [👎] [📋 Copy] [🔄 Regenerate]                          │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐         │
│ │ Ask AI Coach... (Cmd + Enter to send)              [Stop]  │ [Send]  │
│ └────────────────────────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Keyboard Shortcuts & Accessibility Standards

| Shortcut | Action | Scope |
|----------|--------|-------|
| `Cmd / Ctrl + N` | Create New AI Coach Session | Global |
| `Cmd / Ctrl + K` | Focus Search Bar / Command Palette | Global |
| `Cmd / Ctrl + Enter` | Submit Chat Message | AI Workspace |
| `Escape` | Abort Active Generation / Close Modals | AI Workspace |
| `Arrow Up / Down` | Navigate Sidebar Session List | AI Sidebar |
| `Enter` | Select Focused Conversation | AI Sidebar |

---

## 5. Micro-Interactions & Animation Standards

1. **Streaming Tokens:** Subtle 150ms opacity fade-in as tokens stream from Groq, preventing visual jitter.
2. **Mode Pill Transitions:** Sliding accent underline indicator transitioning between modes.
3. **Session Item Hover:** Fade-in action icons (Rename, Pin, Export, Delete) with 100ms ease-out.
4. **Offline Mode Banner:** Smooth slide-down amber alert when the client enters stale cache mode.
