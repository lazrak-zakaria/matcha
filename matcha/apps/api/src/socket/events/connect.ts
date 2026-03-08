
import { io } from "../../app";


export const connectEvent = () => {
    io.on('connection', (socket) => {
        socket.join(socket.data.user.userId.toString());
    });
}
