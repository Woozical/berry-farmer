import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Alert } from "reactstrap";
import { useAlert } from "../../hooks";

interface FarmDeleteConfirmModalProps {
  toggleFunction: Function, confirmFunction: Function, isOpen: boolean
}

export default function FarmDeleteConfirmModal (props:FarmDeleteConfirmModalProps) {
  const [alertState, notify] = useAlert();

  const handleConfirmClick = () => {
    try {
      props.confirmFunction();
    } catch (err:any) {
      console.error(err);
      notify(err.message ? err.message : "Error", "danger");
    }
  };

  return (
    <Modal isOpen={props.isOpen} toggle={() => { props.toggleFunction(); }}>
      <ModalHeader toggle={() => { props.toggleFunction(); }}>
        Warning!
      </ModalHeader>
      <ModalBody>
        Are you sure that you want to delete this farm? All planted crops and farm upgrades will be lost forever
        and are not recoverable.
        {alertState.msg &&
          <Alert
            color={alertState.color || "info"}
            className="mt-4 text-center"
            toggle={() => { notify(""); }}
          >
            {alertState.msg}
          </Alert>}
      </ModalBody>
      <ModalFooter>
        <Button
          color="danger"
          onClick={handleConfirmClick}
        >
          Delete
        </Button>
        {' '}
        <Button onClick={() => { props.toggleFunction(); }}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>)
}