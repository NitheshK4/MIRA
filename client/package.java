package com.example.acieclient.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.List;

class Client {
    private int clientId;
    private String firstName;
    private String lastName;
    private String email;
    private boolean isActive;

    public Client(int clientId, String firstName, String lastName, String email, boolean isActive) {
        this.clientId = clientId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.isActive = isActive;
    }

    public int getClientId() { return clientId; }
    public void setClientId(int clientId) { this.clientId = clientId; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public boolean isIsActive() { return isActive; }
}

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    private final List<Client> clients = new ArrayList<>() {{
        add(new Client(1, "Bevinto", "Paul", "bevintop@gmail.com", true));
        add(new Client(2, "John", "Doe", "john.doe@example.com", true));
    }};

    @GetMapping
    public List<Client> getAllClients() {
        return clients;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getClientById(@PathVariable int id) {
        return clients.stream()
                .filter(c -> c.getClientId() == id)
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    public ResponseEntity<Client> createClient(@RequestBody Client newClient) {
        newClient.setClientId(clients.size() + 1);
        clients.add(newClient);
        return new ResponseEntity<>(newClient, HttpStatus.CREATED);
    }
}
