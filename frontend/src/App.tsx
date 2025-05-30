import { useState, useRef, useEffect } from 'react'
import {
  ChakraProvider,
  Box,
  VStack,
  Input,
  Button,
  Text,
  Textarea,
  Container,
  Heading,
  createStandaloneToast,
  Select,
  useColorModeValue,
  Flex,
  Icon,
  Center,
  Grid,
  GridItem,
} from '@chakra-ui/react'
import axios from 'axios'

const { ToastContainer, toast } = createStandaloneToast()

interface Message {
  role: 'developer' | 'user' | 'assistant'
  content: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [developerMessage, setDeveloperMessage] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4.1-mini')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const assistantBg = useColorModeValue('blue.50', 'blue.900')
  const userBg = useColorModeValue('white', 'gray.700')
  const inputBg = useColorModeValue('white', 'gray.700')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey) {
      toast({
        title: 'Error',
        description: 'Please enter your OpenAI API key',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)
    const newMessages: Message[] = [
      { role: 'developer', content: developerMessage },
      { role: 'user', content: userMessage },
    ]
    setMessages((prev) => [...prev, ...newMessages])

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: developerMessage,
          user_message: userMessage,
          model,
          api_key: apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }

      let assistantMessage = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        assistantMessage += chunk
        
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === 'assistant') {
            lastMessage.content = assistantMessage
          } else {
            newMessages.push({ role: 'assistant', content: assistantMessage })
          }
          return newMessages
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response from the API',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsLoading(false)
      setUserMessage('')
    }
  }

  return (
    <ChakraProvider>
      <ToastContainer />
      <Center minH="100vh" bg={bgColor} w="100vw">
        <Box w="full" maxW="1400px" px={4}>
          <Grid
            templateRows="auto 1fr auto"
            gap={8}
            h="100vh"
            py={8}
          >
            <GridItem>
              <Heading 
                textAlign="center" 
                bgGradient="linear(to-r, blue.400, purple.500)"
                bgClip="text"
                fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                fontWeight="extrabold"
              >
                AI Chat Interface
              </Heading>
            </GridItem>
            
            <GridItem overflow="hidden">
              <Box
                borderWidth={1}
                borderRadius="xl"
                p={{ base: 4, md: 6 }}
                h="full"
                overflowY="auto"
                bg={inputBg}
                boxShadow="lg"
                borderColor={borderColor}
              >
                {messages.map((message, index) => (
                  <Box
                    key={index}
                    mb={4}
                    p={4}
                    borderRadius="lg"
                    bg={message.role === 'assistant' ? assistantBg : userBg}
                    borderWidth={1}
                    borderColor={borderColor}
                    boxShadow="sm"
                  >
                    <Text 
                      fontWeight="bold" 
                      mb={2}
                      color={message.role === 'assistant' ? 'blue.500' : 'purple.500'}
                    >
                      {message.role.charAt(0).toUpperCase() + message.role.slice(1)}:
                    </Text>
                    <Text whiteSpace="pre-wrap" fontSize="md">{message.content}</Text>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
            </GridItem>

            <GridItem>
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={4}
                    w="full"
                  >
                    <GridItem>
                      <Input
                        placeholder="OpenAI API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        type="password"
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ borderColor: 'blue.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                    </GridItem>
                    
                    <GridItem>
                      <Select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        bg={inputBg}
                        borderColor={borderColor}
                        _hover={{ borderColor: 'blue.400' }}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      >
                        <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </Select>
                    </GridItem>
                  </Grid>

                  <Textarea
                    placeholder="Developer Message"
                    value={developerMessage}
                    onChange={(e) => setDeveloperMessage(e.target.value)}
                    rows={2}
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                  />

                  <Textarea
                    placeholder="User Message"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    rows={2}
                    bg={inputBg}
                    borderColor={borderColor}
                    _hover={{ borderColor: 'blue.400' }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                  />

                  <Button
                    type="submit"
                    width="full"
                    isLoading={isLoading}
                    loadingText="Sending..."
                    colorScheme="blue"
                    size="lg"
                    bgGradient="linear(to-r, blue.400, purple.500)"
                    _hover={{
                      bgGradient: 'linear(to-r, blue.500, purple.600)',
                    }}
                    _active={{
                      bgGradient: 'linear(to-r, blue.600, purple.700)',
                    }}
                  >
                    Send Message
                  </Button>
                </VStack>
              </form>
            </GridItem>
          </Grid>
        </Box>
      </Center>
    </ChakraProvider>
  )
}

export default App
