import React, { useState } from "react";
import { api } from "helpers/api";
import User from "models/User";
import {Link, useNavigate} from "react-router-dom";
import { Button } from "components/ui/Button";
import "styles/views/Register.scss";
import BaseContainer from "components/ui/BaseContainer";
import PropTypes from "prop-types";
import { MAX_USERNAME_LENGTH, MAX_PASSWORD_LENGTH, HTTP_STATUS } from "../../constants/constants";
import { showToast} from "../../helpers/toastService";
import { FaEye, FaEyeSlash } from "react-icons/fa";
/*
It is possible to add multiple components inside a single file,
however be sure not to clutter your files with an endless amount!
As a rule of thumb, use one file per component and only add small,
specific components that belong to the main one in the same file.
 */
const CHAR_NOT_FOUND = -1;
const FormField = (props) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="login field">
      <label className="login label">{props.label}</label>
      {
        props.type !== "password" ? (
          <input
            className="login input"
            placeholder="enter here.."
            value={props.value}
            type={props.type}
            onChange={(e) => props.onChange(e)}
          />
        ) : (
          <div className="password-input">
            <input
              className="login input"
              placeholder="enter here.."
              value={props.value}
              type={showPassword ? "text" : "password"}
              onChange={(e) => props.onChange(e)}
            />
            <Button
              className="login password-button"
              style={{ color: "black"}}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </Button>
          </div>
        )
      }
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  type: PropTypes.string
};

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const doRegister = async () => {
    try {
      const requestBody = JSON.stringify({ username, password });
      const response = await api.post("/users", requestBody);

      // Get the returned user and update a new object.
      const user = new User(response.data);

      sessionStorage.setItem("token", user.token);
      sessionStorage.setItem("id", user.id);
      sessionStorage.setItem("username", user.username);
      // Register successfully worked --> navigate to the route /game in the LobbyRouter
      showToast("Register successful!\nWelcome to this guide for newbies!", "success");
      navigate("/guide");
    } catch (error) {
      let message;
      if (error.response) {
        switch (error.response.status) {
        case HTTP_STATUS.CONFLICT:
          message = "Register failed: Username has been taken, please change a username.";
          break;
        default:
          message = `Register failed: ${error.response.data.reason || "Please try again later."}`;
        }
      } else {
        // if no response from the server
        message = "The server cannot be reached. Please try again later."
      }
      showToast(message, "error");
    }
  };

  return (
    <BaseContainer>
      <div className="register container">
        <div className="login kaeps-title">Kaeps</div>
        <div className="register form">
          <FormField
            label="Username"
            value={username}
            type="text"
            onChange={(e) => {
              const inputValue = e.target.value.replace(/[^\w\s]/gi, "");
              if (inputValue.length <= MAX_USERNAME_LENGTH) {
                setUsername(inputValue);
              }
            }}
          />
          <FormField
            label="Password"
            value={password}
            type="password"
            onChange={(e) => {
              const inputValue = e.target.value.replace(/[^\w\s]/gi, "");
              if (inputValue.length <= MAX_PASSWORD_LENGTH) {
                setPassword(inputValue);
              }
            }}
          />
          <div className="register button-container">
            <Button
              disabled={!username || !password ||password.indexOf(" ") !== CHAR_NOT_FOUND || username.indexOf(" ") !== CHAR_NOT_FOUND }
              width="100%"
              onClick={() => doRegister()}
              style={{ color: "black"}}
            >
              register
            </Button>
          </div>

          <div className="register button-container">
              Already have an account?
            <Link to={"/login"}>Login</Link>
          </div>

        </div>
      </div>
    </BaseContainer>
  );
};

/**
 * You can get access to the history object's properties via the useLocation, useNavigate, useParams, ... hooks.
 */
export default Register;
