---
name: pokemon-team-builder
description: Guides the development of the PokéStrat (Pokémon Team Builder & Strategy Analyzer) application using React (Vite), Express, and Firebase with TypeScript.
---

# PokéStrat: Developer & Agent Guide

This skill provides instructions, formulas, and architectural references for building the PokéStrat (Pokémon Team Builder & Strategy Analyzer) project.

---

## 🛠️ Tech Stack & Setup Recommendations

Use the following stack and libraries to build this project:
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Lucide Icons
- **UI Components**: Radix UI / Shadcn UI (for clean sliders, dialogs, and autocomplete inputs)
- **State Management**: Zustand (lightweight and TypeScript-friendly)
- **Data Fetching/Caching**: TanStack Query (@tanstack/react-query) for caching PokeAPI calls
- **Form Validation**: React Hook Form + Zod (for validation of stats, EVs, and inputs)
- **Data Visualization**: Recharts (for the Radar/Spider chart of team stats)
- **Backend**: Node.js + Express + TypeScript
- **Database/Auth**: Firebase Client SDK (or Firebase Admin SDK on the backend)

---

## 📐 Math & Formula Specifications

When writing code for Pokémon stats calculation, use the official Gen 3+ formulas.

### 1. Stats Calculation (Non-HP)
For Attack, Defense, Special Attack, Special Defense, and Speed:

$$\text{Stat} = \left\lfloor \left( \frac{(2 \times \text{Base} + \text{IV} + \lfloor \text{EV}/4 \rfloor) \times \text{Level}}{100} + 5 \right) \times \text{Nature Modifier} \right\rfloor$$

- **Base**: The base stat value fetched from PokeAPI.
- **IV (Individual Value)**: Integer from `0` to `31` (Default: `31`).
- **EV (Effort Value)**: Integer from `0` to `252` (Total EVs across all stats cannot exceed `508`).
- **Level**: Typically `50` or `100` (Default: `50` for VGC / competitive standard).
- **Nature Modifier**:
  - `1.1` if Nature boosts the stat.
  - `0.9` if Nature hinders the stat.
  - `1.0` if Nature is neutral.

### 2. HP Calculation
For the HP stat (except for Shedinja, which is always `1`):

$$\text{HP} = \left\lfloor \frac{(2 \times \text{Base} + \text{IV} + \lfloor \text{EV}/4 \rfloor) \times \text{Level}}{100} \right\rfloor + \text{Level} + 10$$

---

## 📊 Database Schema (Firestore)

### Collection: `users`
```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}
```

### Collection: `teams`
```typescript
interface PokemonMember {
  name: string;
  spriteUrl: string;
  ability: string;
  item: string;
  nature: string;
  types: string[]; // e.g. ["fire", "flying"]
  evs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  ivs: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves: string[]; // Max 4 move names
}

interface SavedTeam {
  id: string;
  userId: string;
  teamName: string;
  pokemons: PokemonMember[]; // Max 6 pokemons
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}
```

---

## 🧬 Strategy Analyzer Engine Logic (Backend)

The backend Express app should analyze the team payload (`SavedTeam`) and return:

1. **Type Weaknesses Matrix**:
   - Calculate how many Pokémon in the team are weak to each of the 18 types.
   - Flag elements where $\ge 3$ Pokémon share a weakness without a counter-resistance.
2. **Move Type Coverage**:
   - Check if the 24 selected moves (6 Pokémon $\times$ 4 moves) can deal Super Effective damage ($\ge 2\times$) to all 18 defensive types.
3. **Role Distribution**:
   - Analyze stats & moves to categorize team members:
     - **Sweeper**: High Speed + High Attack or Sp. Atk.
     - **Wall / Pivot**: High HP + High Defense or Sp. Defense.
     - **Utility / Support**: Has status moves (e.g., *Thunder Wave, Tailwind, Reflect*).
