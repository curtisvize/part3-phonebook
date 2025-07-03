import { useState, useEffect } from 'react'
import phonebookService from './services/phonebook'

const Filter = ({ filter, change }) => {
  return (
    <div>
      filter shown with <input value={filter} onChange={change}/>
    </div>
  )
}

const PersonForm = ({ submit, name, number, nameChange, numberChange }) => {
  return (
    <form onSubmit={submit}>
      <div>
        name: <input value={name} onChange={nameChange} />
      </div>
      <div>
        number: <input value={number} onChange={numberChange} />
      </div>
      <div>
        <button type="submit">add</button>
      </div>
    </form>
  )
}

const Persons = ({ persons, deletePerson }) => {
  return (
    <div>
      {persons.map(person =>
        <Person
          key={person.name}
          name={person.name}
          number={person.number}
          deletePerson={() => deletePerson(person)}
        />
      )}
    </div>
  )
}

const Person = ({ name, number, deletePerson }) => {
  return (
    <div>
      {name} {number} <button onClick={deletePerson}>delete</button>
    </div>
  )
}

const Notification = ({ message }) => {
  if (message === null) {
    return null
  }

  return (
    <div className={message.type}>
      {message.text}
    </div>
  )
}

const App = () => {
  const [persons, setPersons] = useState([])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [notificationMessage, setNotificationMessage] = useState(null)

  useEffect(() => {
    phonebookService
      .getAll()
      .then(initialPersons => {
        setPersons(initialPersons)
      })
  }, [])
  
  const filteredPersons = persons.filter(person => person.name.toLowerCase().includes(nameFilter.toLowerCase()))
  
  const addName = (event) => {
    event.preventDefault()
    const nameObject = {
      name: newName,
      number: newNumber,
    }
    const existingPerson = persons.find(p => p.name === nameObject.name)

    if (existingPerson) {
      const confirmed = window.confirm(`${nameObject.name} is already added to phonebook, replace the old number with a new one?`)
  
      if (confirmed) {
        const newNameObject = { ...existingPerson, number: newNumber }
        phonebookService
          .update(existingPerson.id, newNameObject)
          .then(returnedPerson => {
            setPersons(persons.map(p => p.id === returnedPerson.id ? returnedPerson : p))
            setNewName('')
            setNewNumber('')
            setNotificationMessage({
              text: `Updated ${returnedPerson.name} to ${returnedPerson.number}`,
              type: 'confirmation'
            })
            setTimeout(() => { setNotificationMessage(null) }, 5000)
          })
          .catch(error => {
            console.log(error)
            if (error.response.statusText === 'Not Found') {
              setNotificationMessage({
                text: `Information of ${existingPerson.name} has already been removed from the server`,
                type: 'error'
              })
              setPersons(persons.filter(p => p.id !== existingPerson.id))
            } else {
              setNotificationMessage({
                text: error.response.data.error,
                type: 'error'
              })
            }
            setTimeout(() => { setNotificationMessage(null) }, 5000)
          })
      }
    } else {
      phonebookService
        .create(nameObject)
        .then(returnedPerson => {
          setPersons(persons.concat(returnedPerson))
          setNewName('')
          setNewNumber('')
          setNotificationMessage({
            text: `Added ${returnedPerson.name}`,
            type: 'confirmation'
          })
          setTimeout(() => { setNotificationMessage(null) }, 5000)
        })
        .catch(error => {
          setNotificationMessage({
            text: error.response.data.error,
            type: 'error'
          })
          setTimeout(() => { setNotificationMessage(null) }, 5000)
        })
    }
  }

  const deletePerson = (person) => {
    const personToDelete = persons.find(p => p.id === person.id)
    const confirmed = window.confirm(`Delete ${person.name}`)

    if (confirmed) {
      phonebookService
        .deletePerson(personToDelete.id)
        .then(response => {
          const updatedPersons = filteredPersons.filter(p => p.id !== response.id)
          setPersons(updatedPersons)
        })
    }
  }

  const handleNameChange = (event) => setNewName(event.target.value)
  const handleNumberChange = (event) => setNewNumber(event.target.value)
  const handleNameFilterChange = (event) => setNameFilter(event.target.value)

  return (
    <div>
      <h2>Phonebook</h2>
      <Notification message={notificationMessage} />
      <Filter filter={nameFilter} change={handleNameFilterChange} />
      <h2>add a new</h2>
      <PersonForm 
        submit={addName}
        name={newName}
        number={newNumber}
        nameChange={handleNameChange}
        numberChange={handleNumberChange}
      />
      <h2>Numbers</h2>
      <Persons persons={filteredPersons} deletePerson={deletePerson}/>
    </div>
  )
}

export default App