import { Card, CardBody } from "reactstrap";

interface HelpPaneProps {
  type: "crop" | "farm" | "inventory"
}


export default function HelpPane(props:HelpPaneProps){
  let msg = "";
  switch (props.type){
    case "crop":
      msg = `Select a crop by clicking on a farm tile with a planted berry. Its information and available options will be viewable here.
      You can plant a berry through the inventory tab while an empty tile is selected.`;
      break;
    case "inventory":
      msg = "Buy or harvest berries to add them to your inventory. From here, you can plant berries on your farms.";
      break;
    case "farm":
      msg = "farm help msg";
      break;
    default:
      throw new Error("Missing prop type from HelpPane component");
  }
  return (
    <Card>
      <CardBody className="text-center">
        <small className="text-muted">{msg}</small>
      </CardBody>
    </Card>
  )
}