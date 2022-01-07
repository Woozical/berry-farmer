import { Card, CardTitle, CardSubtitle, CardBody } from "reactstrap";

interface NewFarmCardProps {
  onClick: Function
}

export default function NewFarmCard() {
  return (
      <Card className="text-center p-3">
        <CardTitle tag="h3">
          New Farm
        </CardTitle>
        <CardSubtitle className="mb-2 mt-2 text-success" tag="h3">
        <i className="bi bi-plus-square text-success"></i>
        </CardSubtitle>
        <CardBody className="text-muted">
          Cost: $1,000
        </CardBody>
      </Card>
  )
}