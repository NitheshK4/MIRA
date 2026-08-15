import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

interface Client {
  clientId: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

const clients: Client[] = [
  { clientId: 1, firstName: 'Bevinto', lastName: 'Paul', email: 'bevintop@gmail.com', isActive: true },
  { clientId: 2, firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', isActive: true }
];

app.get('/api/clients', (req: Request, res: Response) => {
  res.json(clients);
});

app.get('/api/clients/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const client = clients.find(c => c.clientId === id);
  
  if (!client) {
    return res.status(404).json({ message: `Client with ID ${id} not found` });
  }
  
  res.json(client);
});

app.post('/api/clients', (req: Request, res: Response) => {
  const newClient: Client = {
    clientId: clients.length + 1,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    isActive: req.body.isActive ?? true
  };
  
  clients.push(newClient);
  res.status(201).json(newClient);
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
