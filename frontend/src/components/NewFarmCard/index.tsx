import { Card, CardTitle, CardSubtitle, CardBody } from "reactstrap";
import "./style.css";

interface NewFarmCardProps {
  onClick: Function
}

export default function NewFarmCard(props:NewFarmCardProps) {

  const handleClick = () => {
    props.onClick();
  }

  return (
      <Card onClick={handleClick} className="NewFarmCard text-center p-3">
        <CardTitle tag="h5">
          New Farm
        </CardTitle>
        <CardSubtitle className="mb-2 mt-2 text-success" tag="h5">
        <i className="bi bi-plus-square text-success"></i>
        </CardSubtitle>
        <CardBody className="text-muted">
          Cost: $1,000
        </CardBody>
      </Card>
  )
}