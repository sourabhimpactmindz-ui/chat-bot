import {createBrowserRouter} from 'react-router-dom';
import Chatbot from '../pages/chatbot-main/chatbot-main';


const router = createBrowserRouter([
    {
        path : "/",
        element : <Chatbot></Chatbot>
    }
])

export default router;