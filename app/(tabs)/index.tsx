import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUserStore } from "../../store/useUserStore";

export default function App() {
  const { name, setName, clearName } = useUserStore();
  const [input, setInput] = useState<string>("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Name Saver</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Saved Name</Text>
        <Text style={styles.name}>{name || "No name saved yet"}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#888"
        value={input}
        onChangeText={setInput}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          setName(input);
          setInput("");
        }}
      >
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={clearName}>
        <Text style={styles.clearText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb", // light background
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#222",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: "#777",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
    color: "#111",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#000",
  },
  button: {
    backgroundColor: "#4f46e5",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  clearButton: {
    marginTop: 10,
    alignItems: "center",
  },
  clearText: {
    color: "#e11d48",
    fontWeight: "600",
  },
});
