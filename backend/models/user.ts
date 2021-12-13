import db from "../db";
import bcrypt from "bcrypt";

interface RegisterProps{
  username: string,
  email: string,
  password: string
}

export default class User {

  static async register({ username, email, password }:RegisterProps){
    return "foo";
  }
}