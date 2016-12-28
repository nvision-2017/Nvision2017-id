## Signin endpoint example

`http://localhost:3001/signin?url=http://nvision.org.in/dashboard`

## After signin page will be redirected to :

`http://nvision.org.in/dashboard?token=ttttttttttttttttttt`

## A JWT token having the info (Example) :

```
{
  "user": {
    "_id": "5864195760d96d2fe331d7e7",
    "userid": 3,
    "email": "cs15btech11031@iith.ac.in",
    "password": "$2a$10$B/HXGbZDBjO0CuPIa53eWukK/CDpyvR9QjSaqILDx7kIJ5Hp/7oE2",
    "college": "iith",
    "phone": 9876543210,
    "verificationToken": "GJFRRLeKunKBlQSKWnS3tE0iZkxg1WKoleM6QSTBwRPaybtCG5NgV462J4a2ILKa",
    "__v": 0,
    "emailVerified": false,
    "canAccessKeystone": false,
    "name": {
      "first": "prateek",
      "last": ""
    }
  },
  "iat": 1482955096,
  "exp": 1482955996
}
```


## Signout

`http://localhost:3001/signout?url=http://nvision.org.in/`
After signout user will be redirected to specified url.
