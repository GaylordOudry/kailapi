import express          from 'express';
import cors             from 'cors';
import { PrismaClient } from "@prisma/client";
import { isAuth }        from "./middlewares/is-auth.js";

const prisma           = new PrismaClient();
const app = express();

app.use(cors())
app.use(express.json());
app.use(isAuth)

app.get("/", async (req, res) => {
	if (!req.isAuth) {
		return res.status(401).json({
			error: "You are not authenticated"
		})
	}
	try {
		const result = await prisma.user.findMany();
		const users = result.map(user => {
			return {...user, password: null}
		})
		res.json(users);
	}
	catch (err) {
		console.error(err)
	}
})

app.post("/signUp", async (req, res) => {
	const user = req.body;
	if (!user.pseudo || !user.password) {
		res.status(400).json({error: "Missing pseudo or password"})
		return;
	}

	try {
		const hashedPassword = await bcrypt.hash(user.password, 16);
		const result = await prisma.user.create({
			data: {
				...user,
				password: hashedPassword
			}
		});
		res.json({...result, password: null});
	}
	catch (err) {
		console.error(err)
	}
})

app.post("/signIn", async (req, res) => {
	const user = req.body;
	if (!user.pseudo || !user.password) {
		res.status(400).json({error: "Missing pseudo or password"})
		return;
	}

	try {
		const result = await prisma.user.findMany({
			where: {
				pseudo: user.pseudo,
			},
			take: 1
		});

		if (!result) {
			res.status(400).json({error: "User not found"})
			return;
		}

		const resultUser = result[0];
		const isValid = await bcrypt.compare(user.password, resultUser.password);
		if (!isValid) {
			res.status(400).json({error: "Invalid password"})
			return;
		}

		if (!secretKey) {
			res.status(400).json({error: "Missing secret key"})
			return;
		}
		const token = jwt.sign({id: resultUser.id, pseudo: resultUser.pseudo}, secretKey, { expiresIn: "1h" });
		res.json({token, tokenExpiration: 1, user: {...resultUser, password: null}});
	}
	catch (err) {
		console.error(err)
	}
})

app.post("/addTime", async (req, res) => {
	const body = req.body;
	if (!req.isAuth) {
		return res.status(401).json({
			error: "You are not authenticated"
		})
	}
	if (!body.time || !body.track) {
		res.status(400).json({error: "Missing time or track"})
		return;
	}

	try {
		const result = await prisma.trackTime.create({
			data: {
				track: body.track,
				stringTime: body.time,
				user: {
					connect: {
						id: req.userId
					}
				}
			}
		});
		res.json(result);
	}
	catch (err) {
		console.error(err)
	}
})

app.listen(3000, () => {
	console.log("Server is running on port 3000");
})
