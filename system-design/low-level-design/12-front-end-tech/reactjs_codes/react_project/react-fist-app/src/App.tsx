import ListGroup from "./components/ListGroup"
import Alert from "./components/Alert"

function App(){
  const items = ['New York', 'Finland', 'London', 'Paris']
  const handleSelectItem = (item: string) => {
    console.log(item);
  }

  return (
    <div>
      <Alert type="primary" message="A simple primary alert—check it out!" />
      <Alert type="secondary" message="A simple secondary alert—check it out!" />
      <Alert type="success" message="A simple success alert—check it out!" />
      <Alert type="danger" message="A simple danger alert—check it out!" />
      <Alert type="warning" message="A simple warning alert—check it out!" />
      <Alert type="info" message="A simple info alert—check it out!" />
      <Alert type="light" message="A simple light alert—check it out!" />
      <Alert type="dark" message="A simple dark alert—check it out!" />
      <ListGroup items={items} heading="Cities" onSelectItem={handleSelectItem} />
    </div>
  )
}

export default App
