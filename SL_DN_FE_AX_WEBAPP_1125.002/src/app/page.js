// "use client";

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import {
//   Box,
//   Container,
//   Typography,
//   TextField,
//   Button,
//   Link,
//   CircularProgress,
// } from "@mui/material";
// import jwt from "jsonwebtoken"; // Import jsonwebtoken

// export default function SignIn() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!email || !password) {
//       setError("Please enter both email and password.");
//       return;
//     }

//     setIsLoading(true);
//     setError("");

//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
//         {
//           method: "POST",
//           mode: 'no-cors',
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ email, password }),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Invalid credentials");
//       }

//       const  data = await response.json();
//       // console.log("Response:", data);

//       // Decode the JWT and store the token data in localStorage
//       const decoded = jwt.decode(data.token);
//       console.log({decoded: data});
//       Cookies.set("token", data.token);
//       // Cookies.set("userData", JSON.stringify(decoded));
//       Cookies.set("role", decoded.role);
//       // console.log({access001: data.user.access});
//       Cookies.set("access",data.user.access);
//       Cookies.set("userId",data.user.user_id);
//       Cookies.set("userName",data.user.username);

//       router.push("/app");
//     } catch (error) {
//       setError(error.message || "Invalid email or password. Please try again.");
//       // console.log("Login error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div style={{ position: "relative", height: "100vh" }}>
//       <div
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           bottom: 0,
//           backgroundImage: "url('../../assets/images/bg.jpg')",
//           backgroundSize: "cover",
//           backgroundPosition: "center",
//           filter: "blur(8px)",
//           zIndex: -1,
//         }}
//       ></div>

//       <Container
//         component="main"
//         maxWidth="xs"
//         sx={{
//           position: "absolute",
//           top: "50%",
//           left: "50%",
//           transform: "translate(-50%, -50%)",
//         }}
//       >

//         <Box
//           sx={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             padding: 4,
//             boxShadow: 6,
//             borderRadius: 3,
//             backgroundColor: "rgba(255, 255, 255, 0.9)",
//             backdropFilter: "blur(10px)",
//             // transition: "transform 0.3s ease-in-out",
//             // "&:hover": {
//             //   transform: "scale(1.05)",
//             // },
//           }}
//         >
//           <img src="/icons/Arg_s7Cars Logo.png" alt="logo" width={200} height={100}/>
//           {/* <Typography
//             component="h1"
//             variant="h4"
//             sx={{ mb: 2, fontWeight: 600 }}
//           >
//             Login
//           </Typography> */}

//           {error && (
//             <Typography color="error" sx={{ mb: 2 }}>
//               {error}
//             </Typography>
//           )}

//           <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               id="email"
//               label="User Name"
//               name="email"
//               autoComplete="email"
//               autoFocus
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               sx={{
//                 borderRadius: 2,
//                 "& .MuiInputBase-root": {
//                   borderRadius: 2,
//                 },
//               }}
//             />
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               name="password"
//               label="Password"
//               type="password"
//               id="password"
//               autoComplete="current-password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               sx={{
//                 borderRadius: 2,
//                 "& .MuiInputBase-root": {
//                   borderRadius: 2,
//                 },
//               }}
//             />

//             {/* <Box
//               display="flex"
//               justifyContent="space-between"
//               alignItems="center"
//               sx={{ mb: 2 }}
//             >
//               <Link href="#" variant="body2">
//                 Forgot password?
//               </Link>
//             </Box> */}

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               sx={{
//                 mt: 3,
//                 mb: 2,
//                 borderRadius: 20,
//                 fontSize: "1.1rem",
//                 fontWeight: "bold",
//                 padding: "10px 20px",
//                 boxShadow: 3,
//                 "&:hover": {
//                   backgroundColor: "#0069c0",
//                 },
//               }}
//               disabled={isLoading}
//             >
//               {isLoading ? (
//                 <CircularProgress size={24} sx={{ color: "white" }} />
//               ) : (
//                 "LOGIN"
//               )}
//             </Button>

//             {/* <Link
//               href="#"
//               variant="body2"
//               sx={{
//                 display: "block",
//                 textAlign: "center",
//                 textDecoration: "underline",
//                 fontSize: "0.9rem",
//                 color: "#0069c0",
//                 "&:hover": {
//                   color: "#004c8c",
//                 },
//               }}
//             >
//               Forgot password?
//             </Link> */}
//           </Box>
//         </Box>
//       </Container>
//     </div>
//   );
// }

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
} from "@mui/material"; 

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid credentials");
      }

      const data = await response.json();
      // console.log("Response:", data);

      Cookies.set("token", data.token);
      Cookies.set("role", data.user.role_name);
      // console.log({access001: data.user.access});
      Cookies.set("access", data.user.access);
      Cookies.set("userId", data.user.user_id);
      Cookies.set("userName", data.user.username);
      Cookies.set("phone", data.user.phone);

      // Store company codes in cookie if provided by backend
      // Support both company_codes (array) and company_code (single) for backward compatibility
      if (data.user.company_codes && Array.isArray(data.user.company_codes)) {
        Cookies.set("company_codes", JSON.stringify(data.user.company_codes));
        // Set current_company_code to the first one
        Cookies.set("current_company_code", data.user.company_codes[0]);
        Cookies.set("companyCode", data.user.company_codes[0]);
      } else if (data.user.company_code) {
        // Backward compatibility with single company_code
        Cookies.set("company_codes", JSON.stringify([data.user.company_code]));
        Cookies.set("current_company_code", data.user.company_code);
        Cookies.set("companyCode", data.user.company_code);
      }

      router.push("/views");
    } catch (error) {
      setError(error.message || "Invalid email or password. Please try again.");
      // console.log("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)",
          zIndex: -1,
        }}
      ></div>

      <Container
        component="main"
        maxWidth="xs"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 4,
            boxShadow: 6,
            borderRadius: 3,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            // transition: "transform 0.3s ease-in-out",
            // "&:hover": {
            //   transform: "scale(1.05)",
            // },
          }}
        >
          <img
            src="/icons/Arg_s7Cars Logo.png"
            alt="logo"
            width={200}
            height={100}
          />
          {/* <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 2, fontWeight: 600 }}
          >
            Login
          </Typography> */}

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                borderRadius: 2,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                borderRadius: 2,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            {/* <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Box> */}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                borderRadius: 20,
                fontSize: "1.1rem",
                fontWeight: "bold",
                padding: "10px 20px",
                boxShadow: 3,
                "&:hover": {
                  backgroundColor: "#0069c0",
                },
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: "white" }} />
              ) : (
                "LOGIN"
              )}
            </Button>

            {/* <Link
              href="#"
              variant="body2"
              sx={{
                display: "block",
                textAlign: "center",
                textDecoration: "underline",
                fontSize: "0.9rem",
                color: "#0069c0",
                "&:hover": {
                  color: "#004c8c",
                },
              }}
            >
              Forgot password?
            </Link> */}
          </Box>
        </Box>
      </Container>
    </div>
  );
}
