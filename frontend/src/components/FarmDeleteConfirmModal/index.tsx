import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "reactstrap"

interface FarmDeleteConfirmModalProps {
  toggleFunction: Function, confirmFunction: Function, isOpen: boolean
}

export default function FarmDeleteConfirmModal (props:FarmDeleteConfirmModalProps) {
  return (
    <Modal isOpen={props.isOpen} toggle={() => { props.toggleFunction() }}>
      <ModalHeader toggle={() => { props.toggleFunction() }}>
        Warning!
      </ModalHeader>
      <ModalBody>
        Are you sure that you want to delete this farm? All planted crops and farm upgrades will be lost forever
        and are not recoverable.
      </ModalBody>
      <ModalFooter>
        <Button
          color="danger"
          onClick={() => { props.confirmFunction() }}
        >
          Delete
        </Button>
        {' '}
        <Button onClick={() => { props.toggleFunction() }}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>)
}