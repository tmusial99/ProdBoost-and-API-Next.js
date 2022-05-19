import axios from "./axios";

export async function updateSession(){
    await axios.get('/api/auth/session?update=true')
    const event = new Event("visibilitychange");
    document.dispatchEvent(event);
}