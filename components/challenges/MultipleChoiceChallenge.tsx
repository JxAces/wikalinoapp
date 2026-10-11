import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTheme } from "../../constants/colors";

type Props = {
  question: {
    question: string;
    choices: string[];
    answer: string;
  };
  selectedAnswer?: string;
  onSelect: (value: string) => void;
};

export default function MultipleChoiceChallenge({
  question,
  selectedAnswer,
  onSelect,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question.question}</Text>

      {question.choices.map((choice) => (
        <Pressable key={choice} onPress={() => onSelect(choice)} style={[styles.choice, selectedAnswer === choice && styles.selected]}>
          <Text style={styles.choiceText}>{choice}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  question: { color: AppTheme.text, fontSize: 17, lineHeight: 24, fontWeight: "700", marginBottom: 4 },
  choice: { minHeight: 48, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: AppTheme.border, backgroundColor: AppTheme.surface },
  selected: { borderColor: AppTheme.primary, backgroundColor: AppTheme.selected },
  choiceText: { color: AppTheme.text, fontSize: 15, lineHeight: 21 },
});
