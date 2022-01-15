import { Form, FormFeedback, Card, CardBody, Label, FormGroup, Button, Input } from "reactstrap";
import { ChangeEvent, FormEventHandler, useState } from "react";
import { validateFormData, titleCase } from "../../utils";
import schema from "../../schemas/SignupForm.json";
import LoadingSpinner from "../LoadingSpinner";

interface FeedBackState {
  username: Array<String>, email: Array<String>, password: Array<String>, confirmPassword: Array<String>
  failedSignup: boolean, apiResponse: string
}

interface FormData {
  username: string, email: string, password: string, confirmPassword: string
}

interface SignupFormProps {
  submitCallback: Function
}


export default function SignupForm({ submitCallback }:SignupFormProps){
  const DEFAULT_STATE:FormData = { confirmPassword : "", email: "", username: "", password: "", };
  const DEFAULT_FEEDBACK_STATE:FeedBackState = {
    username: [], email: [], password: [], confirmPassword: [], failedSignup: false, apiResponse: ""
  };
  
  const [formData, setFormData] = useState(DEFAULT_STATE);
  const [formFeedback, setFormFeedback] = useState(DEFAULT_FEEDBACK_STATE);
  const [awaitingAPI, setAwaitingAPI] = useState(false);

  const handleChange = (evt:ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    setFormData( data => ({...data, [name] : value}) );
  }
  const handleSubmit:FormEventHandler<HTMLFormElement> = async (evt) => {
    evt.preventDefault();
    const validation = validateFormData(formData, schema);
    
    if (validation.success){
      setAwaitingAPI(true);
      setFormFeedback(DEFAULT_FEEDBACK_STATE);
      const [loginAttempt, apiResponse] = await submitCallback(formData);
      // If the API did not respond with a success, clear pw state and display fail message
      if (!loginAttempt){
        setAwaitingAPI(false);
        setFormFeedback({...DEFAULT_FEEDBACK_STATE, failedSignup: true, apiResponse: titleCase(apiResponse)});
        setFormData({...DEFAULT_STATE, username: formData.username, email: formData.email});
      }
    } else {
      setFormFeedback({...DEFAULT_FEEDBACK_STATE, ...validation.errors})
    }
  }

  return (
    <Card>
      <CardBody>
        <Form onSubmit={handleSubmit}>
      
        <FormGroup>
          <Label htmlFor="signup-username"><b>Username</b></Label>
          <Input
            onChange={handleChange}
            type="text"
            id="signup-username"
            name="username"
            value={formData.username}
            invalid={formFeedback.username.length > 0} />
            <FormFeedback>
              {formFeedback.username.map((msg, i) => <small key={`username-${i}`}>{msg} <br/></small>)}
            </FormFeedback>
        </FormGroup>
      
        <FormGroup>
          <Label htmlFor="signup-email"><b>Email</b></Label>
          <Input
            onChange={handleChange}
            type="email"
            id="signup-email"
            name="email"
            value={formData.email}
            invalid={formFeedback.email.length > 0} />
          <FormFeedback>
            {formFeedback.email.map((msg, i) => <small key={`email-${i}`}>{msg} <br/></small>)}
          </FormFeedback>
        </FormGroup>
      
        <FormGroup>
          <Label htmlFor="signup-password"><b>Password</b></Label>
          <Input
            onChange={handleChange}
            type="password"
            id="signup-password"
            name="password"
            value={formData.password}
            invalid={formFeedback.password.length > 0} />
          <FormFeedback>
            {formFeedback.password.map((msg, i) => <small key={`password-${i}`}>{msg} <br/></small>)}
          </FormFeedback>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="signup-confirm-password"><b>Confirm Password</b></Label>
          <Input
            onChange={handleChange}
            type="password"
            id="signup-confirm-password"
            name="confirmPassword"
            value={formData.confirmPassword}
            invalid={formFeedback.confirmPassword.length > 0} />
          <FormFeedback>
            {formFeedback.confirmPassword.map((msg, i) => <small key={`confirmPassword-${i}`}>{msg} <br/></small>)}
          </FormFeedback>
        </FormGroup>
      
      {formFeedback.failedSignup && <p className="text-center text-danger">{formFeedback.apiResponse}</p>}

      <div className="text-center">
        { awaitingAPI ? <LoadingSpinner /> : <Button color="primary">Submit</Button> }
      </div>
    </Form>
  </CardBody>
</Card>

)
}