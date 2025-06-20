''' 
ijk are the central qubits of the circuit. 
They act as a control switch by returning eight possible vector states. 
This file includes the functions which create those states on ijk.
'''

import cirq

# We begin by creating i,j and k and entangling j and k with i.

i = cirq.NamedQubit('i')
j = cirq.NamedQubit('j')
k = cirq.NamedQubit('k')
circuit1 = cirq.Circuit(cirq.H(i), cirq.CNOT(i,j), cirq.CNOT(i,k),cirq.X(i)**0.5, cirq.measure(i,j,k))
simulator = cirq.Simulator()
result1 = simulator.run(circuit1, repetitions=10)

print('Circuit:')
print(circuit1)
print('Results:')
print(result1)

'''#fix
We then define functions based on the state vectors measured for ijk
## Call on measurement gate results to execute an if statement that confirms the state of the qubit
# If the qubit is in state |000⟩, execute the on function
# If the qubit is in state |111⟩, execute the off function
# If the qubit is in state |010⟩, execute the send function
# If the qubit is in state |001⟩, execute the receive function
# If the qubit is in state |101⟩, execute the read function
# If the qubit is in state |110⟩, execute the write function
# If the qubit is in state |100⟩, execute the delete function
# If the qubit is in state |011⟩, execute the store function
'''

#Reset i to |0> and entangle with j and k. Print circuit and return 000 state. 
def on_state(i, j, k):
    def on_state(i, j, k):
    circuit_on = cirq.Circuit(cirq.R(i), cirq.CNOT(i, j), cirq.CNOT(i, k), cirq.measure(i,j,k)) 
    sim = cirq.Simulator()
    result = sim.run(circuit_on, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("Circuit on_state:"), print(circuit_on)
    print("Result one_state:"), print(result)
    print("Measurement vector:", vector)
    return(vector)
on_state(i, j, k)

''' 
on_state:
Circuit
i: ───R───@───@───M───
          │   │   │
j: ───────X───┼───M───
              │   │
k: ───────────X───M───
Result:
i,j,k=0, 0, 0
Measurement vector: 000
'''

#Reset i to |0>, X flip i to |1> and entangle with j and k. Print circuit and return 111 state. 
def off_state(i, j, k):
    circuit_off = cirq.Circuit(cirq.R(i), cirq.X(i), cirq.CNOT(i, j), cirq.CNOT(i, k), cirq.measure(i, j, k))
    sim = cirq.Simulator()
    result = sim.run(circuit_off, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("Circuit off_state:"), print(circuit_off)
    print("Result off_state:"), print(result)
    print("Measurement vector:", vector)
    return(vector)
off_state(i,j,k)

'''
off_state:
Circuit
i: ───R───X───@───@───M───
              │   │   │
j: ───────────X───┼───M───
                  │   │
k: ───────────────X───M───
Result:
i,j,k=1, 1, 1
Measurement vector: 111
'''

#Reset i to |0>, X flip i and entangle with j and k. X flip j. Print circuit and return 101 state. 
def read_state(i,j,k): 
    circuit_read = cirq.Circuit(cirq.R(i), cirq.X(i), cirq.CNOT(i, j), cirq.CNOT(i, k), cirq.X(j), cirq.measure(i,j,k))
    sim = cirq.Simulator()
    result = sim.run(circuit_read, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("read_state:\nCircuit"), print(circuit_read)
    print("Result"), print(result)
    print("Measurement vector:", vector)
    return(vector)
read_state(i,j,k)

'''
read_state:
Circuit
                  ┌──┐
i: ───R───X───@────@─────M───
              │    │     │
j: ───────────X────┼X────M───
                   │     │
k: ────────────────X─────M───
                  └──┘
Result
i,j,k=1, 0, 1
Measurement vector: 101
'''

#Reset i to |0>, X flip i and entangle with j and k. X flip k. Print circuit and return 110 state. 
def write_state(i,j,k):
    circuit_write = cirq.Circuit(cirq.R(i), cirq.X(i), cirq.CNOT(i, j), cirq.CNOT(i, k), cirq.X(k), cirq.measure(i,j,k))
    sim = cirq.Simulator()
    result = sim.run(circuit_write, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("write_state:\nCircuit"), print(circuit_write)
    print("Result"), print(result)
    print("Measurement vector:", vector)
    return(vector)
write_state(i,j,k)

'''
write_state:
Circuit
i: ───R───X───@───@───────M───
              │   │       │
j: ───────────X───┼───────M───
                  │       │
k: ───────────────X───X───M───
Result
i,j,k=1, 1, 0
Measurement vector: 110
'''

#Reset i to |0> and entangle with j and k. X flip k. Print circuit and return 001 state. 
def receive_state(i,j,k): 
    circuit_receive = cirq.Circuit(cirq.R(i), cirq.CNOT(i, j), cirq.CNOT(i, k), cirq.X(k), cirq.measure(i,j,k)) 
    sim = cirq.Simulator()
    result = sim.run(circuit_receive, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("Circuit receive_state:"), print(circuit_receive)
    print("Result receive_state:"), print(result)
    print("Measurement vector:", vector)
    return(vector)
receive_state(i,j,k)

'''
receive_state:
Circuit
i: ───R───@───@───────M───
          │   │       │
j: ───────X───┼───────M───
              │       │
k: ───────────X───X───M───
Result:
i,j,k=0, 0, 1
Measurement vector: 001
'''

#Reset i to |0> and entangle with j and k. X flip j. Print circuit and return 010 state. 
def send_state(i,j,k):
    circuit_send = cirq.Circuit(cirq.R(i), cirq.CNOT(i, j), cirq.CNOT(i, k), cirq.X(j), cirq.measure(i,j,k))
    sim = cirq.Simulator()
    result = sim.run(circuit_send, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("send_state:\nCircuit"), print(circuit_send)
    print("Result"), print(result)
    print("Measurement vector:", vector)
    return(vector)
send_state(i,j,k)

'''
send_state:
Circuit
              ┌──┐
i: ───R───@────@─────M───
          │    │     │
j: ───────X────┼X────M───
               │     │
k: ────────────X─────M───
              └──┘
Result
i,j,k=0, 1, 0
Measurement vector: 010
'''

#Reset i to |0>, X flip i and entangle with j and k. X flip i. Print circuit and return 011 state. 
def store_state(i,j,k):
    circuit_store = cirq.Circuit(cirq.R(i), cirq.X(i), cirq.CNOT(i, j), cirq.CNOT(i, k), cirq.X(i), cirq.measure(i,j,k))
    sim = cirq.Simulator()
    result = sim.run(circuit_store, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("store_state:\nCircuit"), print(circuit_store)
    print("Result"), print(result)
    print("Measurement vector:", vector)
    return(vector)
store_state(i,j,k)

'''
store_state:
Circuit
i: ───R───X───@───@───X───M───
              │   │       │
j: ───────────X───┼───────M───
                  │       │
k: ───────────────X───────M───
Result
i,j,k=0, 1, 1
Measurement vector: 011
'''

#Reset i to |0> and entangle with j and k. X flip i to |1>. Print circuit and return 100 state. 
def delete_state(i,j,k): # |100>
    circuit_delete = cirq.Circuit(cirq.R(i), cirq.CNOT(i,j), cirq.CNOT(i, k), cirq.X(i), cirq.measure(i,j,k))
    sim = cirq.Simulator()
    result = sim.run(circuit_delete, repetitions=1)
    measurement = "".join((map(str,result.measurements.values())))
    vector = ''.join(measurement.split())[2:5]
    print("delete_state:\nCircuit"), print(circuit_delete)
    print("Result"), print(result)
    print("Measurement vector:", vector)
    return(vector)
delete_state(i,j,k)

'''
delete_state:
Circuit
i: ───R───X───@───M───
              │   │
j: ───────────×───M───
              │   │
k: ───────────×───M───
Result
i,j,k=1, 0, 0
Measurement vector: 100
'''

if __name__ == '__main__':
    main()









