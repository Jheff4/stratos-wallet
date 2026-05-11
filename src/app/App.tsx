import { routes } from './routing'

function App() {
  const activeRoute = routes[0]

  return activeRoute.element
}

export default App
