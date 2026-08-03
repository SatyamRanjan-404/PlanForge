/**
 * Agent Registry
 * Maps out what capabilities our agents have and which Redis queue they listen to.
 */
const AgentRegistry = {
    PLANNER: {
        id: 'planner',
        description: 'Breaks down a top-level prompt into a series of executable subtasks.',
        queueName: 'queue:planner'
    },
    EXECUTOR: {
        id: 'executor',
        description: 'Takes a specific subtask and external tools, executing the actual logical work.',
        queueName: 'queue:executor'
    },
    VALIDATOR: {
        id: 'validator',
        description: 'Checks the executor output against goal rules to pass or retry.',
        queueName: 'queue:validator'
    },
    DEAD_LETTER: {
        id: 'dead_letter',
        description: 'Graveyard for tasks that exceeded retry limits.',
        queueName: 'queue:dead_letter'
    }
};

module.exports = AgentRegistry;
