import { Card, CardBody, Label, Form, Input } from "reactstrap";
import { ChangeEvent, FormEventHandler, useState } from "react";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import { LocationObject } from "../../BerryFarmerAPI";

export default function FarmCreateForm(){
  const [location, setLocation] = useState<LocationObject>();
  const [formData, setFormData] = useState({ search: "" });
  
  const searchForLocation:FormEventHandler = async (evt) => {
    evt.preventDefault();
    if (!formData.search) return;
    const location = await BerryFarmerAPI.createLocation(formData.search);
    setLocation(location);
  };

  const handleChange = (evt:ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setFormData( data => ({...data, [name] : value}) );
  };

  const createFarm:FormEventHandler = async (evt) => {
    evt.preventDefault();
    if (location === undefined || !location.id) return;
    const farm = await BerryFarmerAPI.buyFarm(location.id);
  }

  return (
    <Card>
      <CardBody>
        <Form>
          <Label htmlFor="farm-create-search">Enter a city name, postal code, etc:</Label>
          <Input
            onChange={handleChange}
            id="farm-create-search"
            name="search"
            type="text"
            value={formData.search}
          />
          <button onClick={searchForLocation}>Search</button>
          <hr />
          { location && 
            `Found: ${location.name}, ${location.region}, ${location.country}`
          }
          <button onClick={createFarm} disabled={location === undefined}>Create</button>
        </Form>
      </CardBody>
    </Card>
  )
}