import axios from "./axios";

export async function updateSession(){
    await axios.get('/api/auth/session?update')
    const event = new Event("visibilitychange");
    document.dispatchEvent(event);
}