// reusable function for sending whatsapp messages 
import axios from "axios";
// import multer from "multer"; // Import multer
import Cookies from "js-cookie";
const storedToken = Cookies.get("token");


export const sendWhatsappMessage = async (fromNumber, toNumber, message = null, type, file = null, caption = null) => {
    const formData = new FormData();
    formData.append("fromNumber", fromNumber);
    formData.append("toNumber", toNumber);
    // formData.append("caption", caption); // Use caption for the message
    if (type === "file") {
        // Use multer to handle the file upload
        formData.append("file", file);
        formData.append("caption", caption);
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send-file`, formData, {
            headers: {
                Authorization: `Bearer ${storedToken}`,
                'Content-Type': 'multipart/form-data' // Set the content type for file upload
            }
        });
        return response.data;
    }
    else if (type === "text") {
        const data = JSON.stringify({
            fromNumber: fromNumber,
            toNumber: toNumber,
            message: message
        });
        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/send`, data, {
            headers: {
                Authorization: `Bearer ${storedToken}`,
                'Content-Type': 'application/json' // Set the content type for JSON data
            }
        });
        return response.data;
    }
    else {
        return "Invalid type";
    }
};

// check whatsapp  logged in or not in  cookies
export const checkWhatsappLoggedIn = () => {
    const storedStatus = Cookies.get("connection_status");
    const storedPhone = Cookies.get("phone");
    
    if (storedStatus === "active" && storedPhone) {
      return true;
    }
    else {
        return false;
    }
};
