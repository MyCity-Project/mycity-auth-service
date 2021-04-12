# Authentication backend

## Api

### Signinig up

**Request**

POST /auth/signup

```
body {
  name: string, // user name
  email: string, // user email
  password: string // password
}
```

**Response**

```
// Plain txt
A verification token has been sent to email.
```

### Logging in

**Request**

POST /auth/login

```
body {
  email:string,
  password:string
}
```

**Response**

```
{
  token:string,
  username: string, // username of a user
  email: string, // email of a user
  exp: number, // token expire time
}
```

### Verifying account

**Request**

POST /auth/confirmation

```
body {
  email: string, // hidden input
  token: string  // sent to email
}
```

**Response**

```
// Plain text
Your account has been verified. Please log in.
```

### Resending token

**Request**

POST /auth/resend

```
body {
  email: string
}
```

**Response**

```
// Plain text
A verification token has been sent to your email.
```

## Errors

### Error Response Format

```javascript
{
  errors: [
    {
      msg: string, // error message
      type: string, // (Optional) error type
      param: string, // (Optional) variable name
      location: string, // (Optional) location of the param while requesting
      value: any, // (Optional) value of the param in location
    },
  ];
}
```

### **401** Unauthorized

**Example** Response

```json
{
  "errors": [
    {
      "msg": "Email or password is invalid"
    }
  ]
}
```

### **422** Unprocessable Entry

This is trigger when there are not enough input values.

**Example** Response

```json
{
  "errors": [
    {
      "msg": "Email is not valid",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Email cannot be blank",
      "param": "email",
      "location": "body"
    },
    {
      "msg": "Password must be at least 5 characters long",
      "param": "password",
      "location": "body"
    }
  ]
}
```

- Email in request body is not valid

### **500** Internal Server Error

**Example** Response

```json
{
  "errors": [
    {
      "msg": "Failed to send validation email"
    }
  ]
}
```
