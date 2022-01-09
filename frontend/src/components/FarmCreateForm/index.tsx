import { Alert, Label, Form, Input, Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";
import { ChangeEvent, FormEventHandler, useState } from "react";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import { LocationObject } from "../../BerryFarmerAPI";

interface FarmCreateFormProps {
  isOpen: boolean, submitCallback: Function, toggleFunction: Function
}

export default function FarmCreateForm(props:FarmCreateFormProps){
  const [location, setLocation] = useState<LocationObject|null>(null);
  const [formData, setFormData] = useState({ search: "" });
  const [badResult, setBadResult] = useState("");
  
  const searchForLocation:FormEventHandler = async (evt) => {
    evt.preventDefault();
    if (!formData.search) return;
    try {
      const location = await BerryFarmerAPI.createLocation(formData.search);
      setLocation(location);
      setBadResult("");
    } catch (err:any) {
      setLocation(null);
      setBadResult(err.message || "Could not search for that location.");
    }
  };

  const handleChange = (evt:ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setFormData( data => ({...data, [name] : value}) );
  };

  const handleSubmit:FormEventHandler = async (evt) => {
    evt.preventDefault();
    if (!location || !location.id) return;
    await props.submitCallback(location.id);
    setFormData({search: ""});
    setLocation(null);
    setBadResult("");
  }

  return (
    <Form>
      <Modal isOpen={props.isOpen} toggle={() => { props.toggleFunction(); }}>
      <ModalHeader toggle={() => { props.toggleFunction(); }}>
        Create Farm
      </ModalHeader>
      <ModalBody className="text-center">
        <Label htmlFor="farm-create-search">Enter a city name, postal code, etc:</Label>
        <Input
          className="mb-2"
          onChange={handleChange}
          id="farm-create-search"
          name="search"
          type="text"
          value={formData.search}
        />
        <button className="btn btn-outline-primary" onClick={searchForLocation}>Search</button>
        <hr />
        { location ? 
          `Found: ${location.name}, ${location.region}, ${location.country}`
          :
          badResult ?
          <Alert color="warning" toggle={() => {setBadResult("");}} >{badResult}</Alert>
          :
          null
        }
      </ModalBody>
      <ModalFooter>
      <button className="btn btn-lg btn-success" onClick={handleSubmit} disabled={!location}>Create</button>
      </ModalFooter>
      </Modal>
    </Form>
  )
}