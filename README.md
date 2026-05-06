# 8-Qutrit Quantum Messaging App

A hybrid classical-quantum messaging system built with [Google Cirq](https://quantumai.google/cirq).

Eight **qutrits** (3-level quantum systems, basis |0⟩ |1⟩ |2⟩) initialize a circuit that routes six messaging operations: **read, write, store, delete, receive, send**.

---

## Architecture

```
8 qutrits — 3^8 = 6,561 basis states
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  q0, q1  control   operation mode
  q2, q3  address   message slot (0–8)
  q4, q5  channel   routing channel (0–8)
  q6, q7  metadata  priority level (0–8)
```

### Operation encoding  (control qutrits q0, q1 in base 3)

| q0 | q1 | Operation |
|----|----|-----------|
| 0  | 0  | ON        |
| 0  | 1  | READ      |
| 0  | 2  | WRITE     |
| 1  | 0  | STORE     |
| 1  | 1  | DELETE    |
| 1  | 2  | SEND      |
| 2  | 0  | RECEIVE   |
| 2  | 1  | OFF       |

### Qutrit gates

| Gate  | Action |
|-------|--------|
| X3    | Cyclic shift: \|0⟩→\|1⟩→\|2⟩→\|0⟩ |
| X3†   | Inverse shift: \|0⟩→\|2⟩→\|1⟩→\|0⟩ |
| QFT3  | Qutrit quantum Fourier transform (superposition over all 3 levels) |
| SUM   | Qutrit CNOT: \|a,b⟩ → \|a,(a+b) mod 3⟩ |

The SUM gate entangles q0 (control) with q2 (address) before measurement,
creating quantum correlation between the operation mode and message routing.

### Text encoding

Each ASCII character is encoded as 5 base-3 trits (3^5 = 243 covers full 7-bit ASCII).
The trit representation is stored alongside the message for quantum-native retrieval.

---

## Files

| File | Description |
|------|-------------|
| `quantum_messaging.py` | Main 8-qutrit engine — gates, circuit builder, `QuantumMessenger` class, demo |
| `central-switch.py`    | Original 3-qubit control switch (8 state vectors → 8 ops) |
| `octahedron-search.JSX`| React component — BFS search over an octahedral semantic space |
| `STATES/`              | Cirq notebooks for each operation state with qubit topology graphs |

---

## Quick start

```bash
pip install cirq numpy
python quantum_messaging.py
```

The demo runs ON → WRITE × 2 → READ × 2 → STORE → SEND → RECEIVE → DELETE → STATUS → OFF,
printing each 8-qutrit circuit and its decoded measurement at every step.
