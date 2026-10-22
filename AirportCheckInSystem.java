
import java.util.LinkedList;
import java.util.Queue;
import java.util.Stack;
import java.util.Scanner;

class Passenger {
    int passengerId;
    String name;
    String destination;
    String flightNumber;

    Passenger(int passengerId, String name, String destination, String flightNumber) {
        this.passengerId = passengerId;
        this.name = name;
        this.destination = destination;
        this.flightNumber = flightNumber;
    }

    void display() {
        System.out.println("Passenger ID: " + passengerId);
        System.out.println("Name: " + name);
        System.out.println("Destination: " + destination);
        System.out.println("Flight Number: " + flightNumber);
        System.out.println("----------------------------");
    }
}

public class AirportCheckInSystem {
    static Queue<Passenger> waitingQueue = new LinkedList<>();
    static Stack<Passenger> checkInHistory = new Stack<>();
    static Scanner sc = new Scanner(System.in);
    static int nextId = 1;

    public static void main(String[] args) {
        int choice;

        do {
            System.out.println("\n===== AIRPORT CHECK-IN SYSTEM =====");
            System.out.println("1. Add Passenger");
            System.out.println("2. Check-in Passenger");
            System.out.println("3. Display Waiting Queue");
            System.out.println("4. View Latest Checked-in Passenger");
            System.out.println("5. Display Check-in History");
            System.out.println("6. Search Passenger Record");
            System.out.println("7. Exit");
            System.out.print("Enter your choice: ");

            while (!sc.hasNextInt()) {
                System.out.println("Please enter a valid number.");
                sc.next();
                System.out.print("Enter your choice: ");
            }

            choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {
                case 1:
                    addPassenger();
                    break;
                case 2:
                    checkInPassenger();
                    break;
                case 3:
                    displayWaitingQueue();
                    break;
                case 4:
                    viewLatestPassenger();
                    break;
                case 5:
                    displayHistory();
                    break;
                case 6:
                    searchPassenger();
                    break;
                case 7:
                    System.out.println("Thank you for using the Airport Check-in System.");
                    break;
                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        } while (choice != 7);

        sc.close();
    }

    static void addPassenger() {
        System.out.print("Enter passenger name: ");
        String name = sc.nextLine();

        System.out.print("Enter destination: ");
        String destination = sc.nextLine();

        System.out.print("Enter flight number: ");
        String flightNumber = sc.nextLine();

        Passenger p = new Passenger(nextId++, name, destination, flightNumber);
        waitingQueue.offer(p);

        System.out.println("Passenger added to the waiting queue successfully.");
        System.out.println("Passenger ID: " + p.passengerId);
    }

    static void checkInPassenger() {
        if (waitingQueue.isEmpty()) {
            System.out.println("No passengers are waiting for check-in.");
            return;
        }

        Passenger p = waitingQueue.poll();
        checkInHistory.push(p);

        System.out.println("Passenger checked in successfully:");
        p.display();
    }

    static void displayWaitingQueue() {
        if (waitingQueue.isEmpty()) {
            System.out.println("The waiting queue is empty.");
            return;
        }

        System.out.println("\n--- Passengers Waiting for Check-in ---");
        for (Passenger p : waitingQueue) {
            p.display();
        }
    }

    static void viewLatestPassenger() {
        if (checkInHistory.isEmpty()) {
            System.out.println("No check-in history available.");
            return;
        }

        System.out.println("\n--- Latest Checked-in Passenger ---");
        checkInHistory.peek().display();
    }

    static void displayHistory() {
        if (checkInHistory.isEmpty()) {
            System.out.println("No check-in history available.");
            return;
        }

        System.out.println("\n--- Check-in History (Latest First) ---");
        for (int i = checkInHistory.size() - 1; i >= 0; i--) {
            checkInHistory.get(i).display();
        }
    }

    static void searchPassenger() {
        System.out.print("Enter passenger ID to search: ");

        while (!sc.hasNextInt()) {
            System.out.println("Please enter a valid passenger ID.");
            sc.next();
            System.out.print("Enter passenger ID to search: ");
        }

        int id = sc.nextInt();
        sc.nextLine();

        for (Passenger p : waitingQueue) {
            if (p.passengerId == id) {
                System.out.println("Passenger is waiting for check-in:");
                p.display();
                return;
            }
        }

        for (Passenger p : checkInHistory) {
            if (p.passengerId == id) {
                System.out.println("Passenger has already checked in:");
                p.display();
                return;
            }
        }

        System.out.println("Passenger record not found.");
    }
}
