"""
8-Qutrit Quantum Messaging App

Qutrits are 3-level quantum systems with basis states |0⟩, |1⟩, |2⟩.
Unlike qubits (2 levels), each qutrit carries log2(3) ≈ 1.585 bits.
8 qutrits span a 3^8 = 6561-dimensional Hilbert space.

Circuit layout:
  q0, q1  — control qutrits  → encode operation mode (8 ops via base-3)
  q2, q3  — address qutrits  → message slot (0–8)
  q4, q5  — channel qutrits  → routing channel (0–8)
  q6, q7  — metadata qutrits → priority level (0–8)

Operation encoding on (q0, q1):
  (0,0)=ON   (0,1)=READ   (0,2)=WRITE
  (1,0)=STORE  (1,1)=DELETE  (1,2)=SEND
  (2,0)=RECEIVE  (2,1)=OFF

Qutrit gates used:
  X3   — cyclic shift  |0⟩→|1⟩→|2⟩→|0⟩
  X3†  — inverse shift |0⟩→|2⟩→|1⟩→|0⟩
  QFT3 — qutrit quantum Fourier transform (superposition over all 3 levels)
  SUM  — qutrit CNOT: |a,b⟩ → |a,(a+b) mod 3⟩
"""

import cirq
import numpy as np
from typing import Optional

# ── Qutrit gate matrices ──────────────────────────────────────────────────────

# X3: cyclic shift |0⟩→|1⟩, |1⟩→|2⟩, |2⟩→|0⟩
_X3 = np.array([
    [0, 0, 1],
    [1, 0, 0],
    [0, 1, 0],
], dtype=complex)

# X3†: inverse cyclic shift  (X3 applied twice)
_X3_INV = _X3 @ _X3  # |0⟩→|2⟩, |1⟩→|0⟩, |2⟩→|1⟩

# QFT3: qutrit quantum Fourier transform
_W = np.exp(2j * np.pi / 3)
_QFT3 = np.array([
    [1,     1,      1    ],
    [1,     _W,     _W**2],
    [1,     _W**2,  _W**4],
], dtype=complex) / np.sqrt(3)

# SUM gate (qutrit CNOT): |a,b⟩ → |a,(a+b) mod 3⟩
# Basis ordering: |00⟩=0, |01⟩=1, |02⟩=2, |10⟩=3, ...
_SUM = np.zeros((9, 9), dtype=complex)
for _a in range(3):
    for _b in range(3):
        _SUM[_a * 3 + (_a + _b) % 3, _a * 3 + _b] = 1

# ── Gate constructors ─────────────────────────────────────────────────────────

def _mg(mat, shape):
    return cirq.MatrixGate(mat, qid_shape=shape)

def X3(q):
    return _mg(_X3, (3,))(q)

def X3_inv(q):
    return _mg(_X3_INV, (3,))(q)

def QFT3(q):
    return _mg(_QFT3, (3,))(q)

def SUM(control, target):
    return _mg(_SUM, (3, 3))(control, target)

# ── 8-Qutrit register ─────────────────────────────────────────────────────────

Q = [cirq.NamedQid(f'q{i}', dimension=3) for i in range(8)]
CTRL = Q[:2]   # q0, q1 — operation control
ADDR = Q[2:4]  # q2, q3 — message address
CHAN = Q[4:6]  # q4, q5 — channel
META = Q[6:8]  # q6, q7 — priority / metadata

# Operation ↔ control-qutrit state mapping
OP_STATE = {
    'on':      (0, 0),
    'read':    (0, 1),
    'write':   (0, 2),
    'store':   (1, 0),
    'delete':  (1, 1),
    'send':    (1, 2),
    'receive': (2, 0),
    'off':     (2, 1),
}
STATE_OP = {v: k for k, v in OP_STATE.items()}

# ── Circuit helpers ───────────────────────────────────────────────────────────

def _set_qutrit(q, val: int) -> list:
    """Gates to set qutrit q to |val⟩ from ground state |0⟩."""
    if val == 1:
        return [X3(q)]
    if val == 2:
        return [X3_inv(q)]
    return []

def _encode_pair(q_hi, q_lo, val: int) -> list:
    """Encode integer val (0-8) into two qutrits as (val//3, val%3)."""
    gates = []
    gates += _set_qutrit(q_hi, val // 3)
    gates += _set_qutrit(q_lo, val % 3)
    return gates

def init_circuit(op: str, msg_id: int = 0, channel: int = 0, priority: int = 0) -> cirq.Circuit:
    """
    Build a full 8-qutrit initialization circuit for the requested operation.

    All integer args encode routing metadata in base 3, range 0-8.
    The SUM gate entangles q0 (control) with q2 (address) before measurement.
    """
    assert op in OP_STATE, f"Unknown op '{op}'. Valid ops: {list(OP_STATE)}"
    assert 0 <= msg_id  <= 8, "msg_id must be in 0-8"
    assert 0 <= channel <= 8, "channel must be in 0-8"
    assert 0 <= priority <= 8, "priority must be in 0-8"

    c0, c1 = OP_STATE[op]
    gates = []

    # Control qutrits: set operation mode
    gates += _set_qutrit(CTRL[0], c0)
    gates += _set_qutrit(CTRL[1], c1)

    # Address qutrits: message slot
    gates += _encode_pair(ADDR[0], ADDR[1], msg_id)

    # Channel qutrits: routing channel
    gates += _encode_pair(CHAN[0], CHAN[1], channel)

    # Metadata qutrits: priority
    gates += _encode_pair(META[0], META[1], priority)

    # SUM gate: entangle control q0 with address q2
    # Creates quantum correlation: |c0,m0⟩ → |c0,(c0+m0)%3⟩
    gates.append(SUM(CTRL[0], ADDR[0]))

    gates.append(cirq.measure(*Q, key='m'))
    return cirq.Circuit(gates)

def decode_result(result: cirq.ResultTypes) -> dict:
    """
    Decode a simulator measurement into operation and routing parameters.
    Inverts the SUM entanglement on the address qutrits.
    """
    m = result.measurements['m'][0].tolist()
    ctrl  = (m[0], m[1])
    # Undo SUM: original addr_hi = (measured_addr_hi - c0) mod 3
    addr_hi = (m[2] - m[0]) % 3
    addr_lo = m[3]
    chan_hi, chan_lo = m[4], m[5]
    meta_hi, meta_lo = m[6], m[7]
    return {
        'op':       STATE_OP.get(ctrl, 'unknown'),
        'msg_id':   addr_hi * 3 + addr_lo,
        'channel':  chan_hi  * 3 + chan_lo,
        'priority': meta_hi  * 3 + meta_lo,
        'raw':      ''.join(map(str, m)),
        'ctrl':     ctrl,
    }

# ── Ternary text encoding ─────────────────────────────────────────────────────

def text_to_trits(text: str) -> list[int]:
    """
    Encode ASCII text as a flat list of trits (base-3 digits).
    Each character → 5 trits (3^5=243 covers ASCII 0-127).
    """
    trits = []
    for ch in text:
        val = ord(ch) & 0x7F  # 7-bit ASCII
        row = []
        for _ in range(5):
            row.append(val % 3)
            val //= 3
        trits.extend(reversed(row))
    return trits

def trits_to_text(trits: list[int]) -> str:
    """Decode a trit list back to ASCII text (inverse of text_to_trits)."""
    chars = []
    for i in range(0, len(trits), 5):
        chunk = trits[i:i + 5]
        if len(chunk) < 5:
            break
        val = 0
        for t in chunk:
            val = val * 3 + t
        chars.append(chr(val))
    return ''.join(chars)

# ── Classical message store ───────────────────────────────────────────────────

class QuantumMessenger:
    """
    Hybrid classical-quantum messaging system.

    Quantum circuits (8 qutrits) route and authorize every operation.
    The measured qutrit state determines which classical action executes.
    Text is stored in classical memory; the quantum layer is the control plane.
    """

    def __init__(self):
        self._store: dict[int, dict] = {}  # slot → message record
        self._inbox: list[dict] = []
        self._sim = cirq.Simulator()
        self._online = False

    # ── Internal: run circuit, decode, print summary ──────────────────────────

    def _run(self, op: str, msg_id=0, channel=0, priority=0) -> dict:
        circuit = init_circuit(op, msg_id, channel, priority)
        result  = self._sim.run(circuit, repetitions=1)
        info    = decode_result(result)
        self._print_circuit(op, circuit, info)
        return info

    @staticmethod
    def _print_circuit(op: str, circuit: cirq.Circuit, info: dict):
        bar = '─' * 64
        print(f"\n{bar}")
        print(f"  OP: {op.upper():<10}  8-qutrit state: |{info['raw']}⟩")
        print(f"  ctrl=({info['ctrl'][0]},{info['ctrl'][1]})  "
              f"msg_id={info['msg_id']}  ch={info['channel']}  pri={info['priority']}")
        print(bar)
        print(circuit)

    # ── Public operations ─────────────────────────────────────────────────────

    def on(self):
        """Bring the quantum messaging circuit online."""
        self._run('on')
        self._online = True
        print("[SYSTEM] Online — 8-qutrit circuit initialized (3^8 = 6,561 states)")

    def off(self):
        """Take the circuit offline."""
        self._run('off')
        self._online = False
        print("[SYSTEM] Offline.")

    def write(self, text: str, msg_id: int, channel: int = 0,
              priority: int = 0, sender: str = 'local', recipient: str = 'remote'):
        """Write a text message to a specific slot."""
        info = self._run('write', msg_id, channel, priority)
        slot = info['msg_id']
        self._store[slot] = {
            'text':     text,
            'trits':    text_to_trits(text),
            'channel':  info['channel'],
            'priority': info['priority'],
            'from':     sender,
            'to':       recipient,
        }
        print(f"[WRITE] Slot {slot} ← \"{text}\"  ({len(text_to_trits(text))} trits)")

    def read(self, msg_id: int) -> Optional[str]:
        """Read a message from the given slot."""
        info = self._run('read', msg_id)
        slot = info['msg_id']
        rec  = self._store.get(slot)
        if rec:
            recovered = trits_to_text(rec['trits'])
            print(f"[READ] Slot {slot}: \"{recovered}\"  "
                  f"(from={rec['from']}, to={rec['to']})")
            return recovered
        print(f"[READ] Slot {slot} is empty.")
        return None

    def store(self, text: str, msg_id: int, channel: int = 0, priority: int = 0):
        """Archive a message (same as write but flagged as archived)."""
        info = self._run('store', msg_id, channel, priority)
        slot = info['msg_id']
        self._store[slot] = {
            'text':     text,
            'trits':    text_to_trits(text),
            'channel':  info['channel'],
            'priority': info['priority'],
            'archived': True,
        }
        print(f"[STORE] Archived \"{text}\" at slot {slot}")

    def delete(self, msg_id: int) -> bool:
        """Delete a message from the given slot."""
        info = self._run('delete', msg_id)
        slot = info['msg_id']
        if slot in self._store:
            removed = self._store.pop(slot)
            print(f"[DELETE] Slot {slot} cleared: \"{removed['text']}\"")
            return True
        print(f"[DELETE] Slot {slot} is already empty.")
        return False

    def send(self, text: str, channel: int = 0,
             priority: int = 0, recipient: str = 'remote') -> dict:
        """Transmit a message over the specified channel."""
        info   = self._run('send', 0, channel, priority)
        packet = {
            'text':     text,
            'trits':    text_to_trits(text),
            'to':       recipient,
            'channel':  info['channel'],
            'priority': info['priority'],
        }
        print(f"[SEND] → ch={info['channel']} pri={info['priority']}  \"{text}\"")
        return packet

    def receive(self, packet: dict) -> str:
        """Receive an incoming message packet."""
        info = self._run('receive', 0, packet.get('channel', 0), packet.get('priority', 0))
        self._inbox.append(packet)
        recovered = trits_to_text(packet['trits']) if 'trits' in packet else packet['text']
        print(f"[RECEIVE] ← ch={info['channel']}  \"{recovered}\"")
        return recovered

    def status(self):
        """Print a summary of stored messages and inbox."""
        bar = '=' * 64
        state = 'ONLINE' if self._online else 'OFFLINE'
        print(f"\n{bar}")
        print(f"  QUANTUM MESSENGER  [{state}]")
        print(f"  Stored: {len(self._store)} message(s)   Inbox: {len(self._inbox)}")
        print(bar)
        for slot, rec in sorted(self._store.items()):
            tag = ' [archived]' if rec.get('archived') else ''
            print(f"  [{slot}] \"{rec['text']}\"{tag}")
        for pkt in self._inbox:
            print(f"   ←  \"{pkt['text']}\"  ch={pkt['channel']}")
        print(bar)


# ── Demo ──────────────────────────────────────────────────────────────────────

def demo():
    print("=" * 64)
    print("  8-QUTRIT QUANTUM MESSAGING APP")
    print("  Qutrit dimensions: 3   |  Circuit width: 8")
    print("  State space: 3^8 = 6,561 basis states")
    print()
    print("  q0,q1 = control   q2,q3 = address")
    print("  q4,q5 = channel   q6,q7 = priority")
    print("=" * 64)

    qm = QuantumMessenger()

    qm.on()

    qm.write("Hello, quantum world!", msg_id=0, channel=1, priority=2)
    qm.write("Entangled greetings",   msg_id=3, channel=2, priority=0)

    qm.read(0)
    qm.read(3)

    qm.store("Archive: qutrit notes", msg_id=6, channel=0, priority=1)

    packet = qm.send("Qutrit ping!", channel=4, priority=1, recipient='node-B')
    qm.receive(packet)

    qm.delete(3)

    qm.status()

    qm.off()


if __name__ == '__main__':
    demo()
