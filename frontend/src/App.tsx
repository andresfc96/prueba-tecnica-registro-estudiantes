import './App.css'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type Subject = {
  id: number
  name: string
  credits: number
  professor: {
    id: number
    name: string
  }
}

type Student = {
  id: number
  firstName: string
  lastName: string
  email: string
  enrollments: Array<{
    subject: Subject
  }>
}

type ClassmatesBySubject = {
  subjectId: number
  subjectName: string
  professorName: string
  classmates: string[]
}

type AlertType = 'success' | 'warning'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classmates, setClassmates] = useState<ClassmatesBySubject[]>([])
  const [pendingRequests, setPendingRequests] = useState(0)
  const [alert, setAlert] = useState<null | { text: string; type: AlertType }>(
    null,
  )

  const [studentForm, setStudentForm] = useState({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
  })

  const [enrollmentStudentId, setEnrollmentStudentId] = useState<number>(0)
  const [classmateStudentId, setClassmateStudentId] = useState<number>(0)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([])
  const selectedSubjectCount = selectedSubjectIds.length
  const isLoading = pendingRequests > 0
  const [usersMenuOpen, setUsersMenuOpen] = useState(true)
  const [activeView, setActiveView] = useState<
    'home' | 'create-user' | 'list-users'
  >('home')

  const studentNameMap = useMemo(
    () =>
      new Map(
        students.map((student) => [
          student.id,
          `${student.firstName} ${student.lastName}`,
        ]),
      ),
    [students],
  )

  async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    setPendingRequests((current) => current + 1)
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          message?: string | string[]
        }
        const apiMessage = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        throw new Error(apiMessage ?? 'Error inesperado del servidor')
      }
      return (await response.json()) as T
    } finally {
      setPendingRequests((current) => Math.max(0, current - 1))
    }
  }

  async function loadInitialData() {
    try {
      const [studentData, subjectData] = await Promise.all([
        fetchJson<Student[]>(`${API_URL}/students`),
        fetchJson<Subject[]>(`${API_URL}/subjects`),
      ])
      setStudents(studentData)
      setSubjects(subjectData)
    } catch (error) {
      setAlert({
        text: error instanceof Error ? error.message : 'No fue posible cargar datos',
        type: 'warning',
      })
    }
  }

  async function onSubmitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      const payload = {
        firstName: studentForm.firstName,
        lastName: studentForm.lastName,
        email: studentForm.email,
      }

      if (studentForm.id) {
        await fetchJson(`${API_URL}/students/${studentForm.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        setAlert({ text: 'Estudiante actualizado', type: 'success' })
      } else {
        await fetchJson(`${API_URL}/students`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setAlert({ text: 'Estudiante creado', type: 'success' })
      }

      setStudentForm({ id: 0, firstName: '', lastName: '', email: '' })
      await loadInitialData()
    } catch (error) {
      setAlert({
        text:
          error instanceof Error
            ? error.message
            : 'No fue posible guardar estudiante',
        type: 'warning',
      })
    }
  }

  async function onDeleteStudent(studentId: number) {
    try {
      await fetchJson(`${API_URL}/students/${studentId}`, { method: 'DELETE' })
      setAlert({ text: 'Estudiante eliminado', type: 'success' })
      await loadInitialData()
    } catch (error) {
      setAlert({
        text:
          error instanceof Error
            ? error.message
            : 'No fue posible eliminar estudiante',
        type: 'warning',
      })
    }
  }

  async function onLoadEnrollment(studentId: number) {
    setEnrollmentStudentId(studentId)
    if (!studentId) {
      setSelectedSubjectIds([])
      return
    }
    try {
      const data = await fetchJson<{ subjects: Subject[] }>(
        `${API_URL}/students/${studentId}/enrollments`,
      )
      setSelectedSubjectIds(data.subjects.map((subject) => subject.id))
    } catch (error) {
      setAlert({
        text:
          error instanceof Error ? error.message : 'No fue posible cargar materias',
        type: 'warning',
      })
    }
  }

  async function onSaveEnrollment() {
    if (selectedSubjectIds.length < 1) {
      setAlert({
        text: 'Debes seleccionar al menos 1 materia',
        type: 'warning',
      })
      return
    }

    try {
      const updatedEnrollment = await fetchJson<{ subjects: Subject[] }>(
        `${API_URL}/students/${enrollmentStudentId}/enrollments`,
        {
          method: 'PUT',
          body: JSON.stringify({ subjectIds: selectedSubjectIds }),
        },
      )
      setSelectedSubjectIds(updatedEnrollment.subjects.map((subject) => subject.id))
      setAlert({ text: 'Inscripcion actualizada', type: 'success' })
      await loadInitialData()
    } catch (error) {
      setAlert({
        text:
          error instanceof Error
            ? error.message
            : 'No fue posible guardar inscripcion',
        type: 'warning',
      })
    }
  }

  async function onLoadClassmates(studentId: number) {
    setClassmateStudentId(studentId)
    if (!studentId) {
      setClassmates([])
      return
    }
    try {
      const data = await fetchJson<ClassmatesBySubject[]>(
        `${API_URL}/students/${studentId}/classmates`,
      )
      setClassmates(data)
      setAlert(null)
    } catch (error) {
      setAlert({
        text:
          error instanceof Error
            ? error.message
            : 'No fue posible consultar companeros',
        type: 'warning',
      })
    }
  }

  function toggleSubject(subjectId: number) {
    setSelectedSubjectIds((current) => {
      if (current.includes(subjectId)) {
        return current.filter((id) => id !== subjectId)
      }
      if (current.length >= 3) {
        setAlert({ text: 'Solo puedes seleccionar 3 materias', type: 'warning' })
        return current
      }
      return [...current, subjectId]
    })
  }

  useEffect(() => {
    void loadInitialData()
  }, [])

  return (
    <main className="container">
      <aside className="floating-menu-card">
        <h3>Menu</h3>
        <div className="menu-main-options">
          <button
            type="button"
            className={`menu-link ${activeView === 'home' ? 'menu-link-active' : ''}`}
            onClick={() => setActiveView('home')}
          >
            Registro
          </button>
          <button
            type="button"
            className="menu-group-toggle"
            onClick={() => setUsersMenuOpen((current) => !current)}
          >
            Usuario
            <span>{usersMenuOpen ? '▾' : '▸'}</span>
          </button>
        </div>
        {usersMenuOpen ? (
          <div className="menu-suboptions">
            <button
              type="button"
              className={`menu-link ${activeView === 'create-user' ? 'menu-link-active' : ''}`}
              onClick={() => {
                setStudentForm({ id: 0, firstName: '', lastName: '', email: '' })
                setActiveView('create-user')
              }}
            >
              Crear usuario
            </button>
            <button
              type="button"
              className={`menu-link ${activeView === 'list-users' ? 'menu-link-active' : ''}`}
              onClick={() => setActiveView('list-users')}
            >
              Listado de usuarios
            </button>
          </div>
        ) : null}
      </aside>

      <header className="hero">
        <h1>Registro de Estudiantes</h1>
        <p>Gestion simple de estudiantes, materias y companeros de clase</p>
      </header>

      {alert ? <p className={`message message-${alert.type}`}>{alert.text}</p> : null}
      {isLoading ? <p className="message message-info">Cargando datos...</p> : null}
      {isLoading ? (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="spinner" />
          <span>Procesando solicitud...</span>
        </div>
      ) : null}

      {activeView === 'create-user' ? (
        <section className="card">
          <h2>Crear Usuario</h2>
          <p className="section-subtitle">
            Completa los datos para registrar un usuario.
          </p>
          <form className="grid-3" onSubmit={onSubmitStudent}>
            <input
              value={studentForm.firstName}
              placeholder="Nombre"
              disabled={isLoading}
              onChange={(event) =>
                setStudentForm((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
              required
            />
            <input
              value={studentForm.lastName}
              placeholder="Apellido"
              disabled={isLoading}
              onChange={(event) =>
                setStudentForm((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
              required
            />
            <input
              value={studentForm.email}
              placeholder="Correo"
              type="email"
              disabled={isLoading}
              onChange={(event) =>
                setStudentForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              required
            />
            <div className="actions">
              <button type="submit" disabled={isLoading}>
                {studentForm.id ? 'Actualizar usuario' : 'Crear usuario'}
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={isLoading}
                onClick={() =>
                  setStudentForm({ id: 0, firstName: '', lastName: '', email: '' })
                }
              >
                Limpiar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {activeView === 'list-users' ? (
        <section className="card">
          <h2>Listado de Usuarios</h2>
          <p className="section-subtitle">
            Consulta y administra los usuarios registrados.
          </p>
          <div className="table">
            <div className="row header">
              <span>Nombre</span>
              <span>Correo</span>
              <span>Materias</span>
              <span>Acciones</span>
            </div>
            {students.map((student) => (
              <div className="row" key={student.id}>
                <span>
                  {student.firstName} {student.lastName}
                </span>
                <span>{student.email}</span>
                <span>
                  {student.enrollments.map((item) => item.subject.name).join(', ') ||
                    'Sin materias'}
                </span>
                <span className="actions">
                  <button
                    type="button"
                    className="button-secondary"
                    disabled={isLoading}
                    onClick={() => {
                      setStudentForm({
                        id: student.id,
                        firstName: student.firstName,
                        lastName: student.lastName,
                        email: student.email,
                      })
                      setActiveView('create-user')
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="button-danger"
                    disabled={isLoading}
                    onClick={() => void onDeleteStudent(student.id)}
                  >
                    Eliminar
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === 'home' ? (
        <>
          <section className="card">
            <h2>Matriz de materias (maximo 3)</h2>
            <p className="section-note">
              Seleccionadas: {selectedSubjectCount}/3. Debes seleccionar al menos 1 y
              no puedes combinar materias del mismo profesor.
            </p>
            <div className="inline-controls">
              <select
                className="student-select"
                value={enrollmentStudentId}
                disabled={isLoading}
                onChange={(event) => {
                  void onLoadEnrollment(Number(event.target.value))
                }}
              >
                <option value={0}>Selecciona estudiante</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
              <button
                className="enrollment-save-button"
                type="button"
                disabled={!enrollmentStudentId || selectedSubjectCount < 1 || isLoading}
                onClick={() => void onSaveEnrollment()}
              >
                Guardar inscripcion
              </button>
            </div>
            <div className="subject-list">
              {subjects.map((subject) => (
                <label key={subject.id} className="subject-item">
                  <input
                    type="checkbox"
                    checked={selectedSubjectIds.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    disabled={!enrollmentStudentId || isLoading}
                  />
                  <span className="subject-content">
                    <strong>{subject.name}</strong>
                    <small>Profesor: {subject.professor.name}</small>
                    <small>Creditos: {subject.credits}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>Companeros por materia</h2>
            <p className="section-note">
              Consulta un estudiante para ver con quienes comparte clase.
            </p>
            <div className="inline-controls">
              <select
                className="student-select"
                value={classmateStudentId}
                disabled={isLoading}
                onChange={(event) => {
                  void onLoadClassmates(Number(event.target.value))
                }}
              >
                <option value={0}>Selecciona estudiante</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {studentNameMap.get(student.id)}
                  </option>
                ))}
              </select>
            </div>
            {classmates.map((item) => (
              <article key={item.subjectId} className="subject-box">
                <h3>{item.subjectName}</h3>
                <p>Profesor: {item.professorName}</p>
                <p>Companeros: {item.classmates.join(', ') || 'Ninguno'}</p>
              </article>
            ))}
          </section>
        </>
      ) : null}
    </main>
  )
}

export default App
