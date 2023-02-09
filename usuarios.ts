
interface User {
    id: number;
    name: string;
    email: string;
    senha: string;
    token?: string;
}
// eslint-disable-next-line prefer-const
let users: Array<User> = [{
    id: 1,
    name: "John",
    email: "john@mail.com",
    senha: "john123"
}, {
    id: 2,
    name: "Sarah",
    email: "sarah@mail.com",
    senha: "sarah123"
}];

export default users;