const { z } = require('zod');
const { StructuredOutputParser } = require('langchain/output_parsers');

describe('Planner Zod Structured Output', () => {
    const subtaskSchema = z.object({
        subtasks: z.array(z.object({
            id: z.string(),
            description: z.string(),
            status: z.string().default('PENDING')
        }))
    });
    
    const parser = StructuredOutputParser.fromZodSchema(subtaskSchema);

    it('should parse valid JSON perfectly matching constraints', async () => {
        const validJSON = `{"subtasks": [{"id": "1", "description": "Research phase", "status": "PENDING"}]}`;
        const result = await parser.parse(validJSON);
        
        expect(result.subtasks.length).toBe(1);
        expect(result.subtasks[0].id).toBe("1");
    });

    it('should explicitly throw an OutputParserException on hallucinated schema keys', async () => {
        // ID is a number instead of string, 'desc' instead of 'description'
        const invalidJSON = `{"subtasks": [{"id": 1, "desc": "Research phase"}]}`; 
        
        await expect(parser.parse(invalidJSON)).rejects.toThrow();
    });
});
