'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const buttonStyles = {
  color: 'white',
  backgroundColor: 'green',
  '&:hover': {
    backgroundColor: 'brown',
  },
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [currentItem, setCurrentItem] = useState(null)
  const [newName, setNewName] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const subscribeToInventory = () => {
    const unsubscribe = onSnapshot(collection(firestore, 'pantry'), (snapshot) => {
      const inventoryList = []
      snapshot.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() })
      })
      setInventory(inventoryList)
    })
    
    return unsubscribe
  }

  useEffect(() => {
    const unsubscribe = subscribeToInventory()
    return () => unsubscribe() // Cleanup subscription on unmount
  }, [])

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: (quantity || 0) + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
  }
  
  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: (quantity || 1) - 1 })
      }
    }
  }

  const updateItem = async (oldName, newName, newQuantity) => {
    const oldDocRef = doc(collection(firestore, 'pantry'), oldName)
    const newDocRef = doc(collection(firestore, 'pantry'), newName)
    
    const oldDocSnap = await getDoc(oldDocRef)
    if (oldDocSnap.exists()) {
      const quantity = parseInt(newQuantity, 10) || 0
      if (oldName !== newName) {
        // Rename item
        await setDoc(newDocRef, { quantity })
        await deleteDoc(oldDocRef)
      } else {
        // Update quantity only
        await setDoc(oldDocRef, { quantity })
      }
    } else {
      console.error('Item does not exist!')
    }
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const handleUpdateOpen = (item) => {
    setCurrentItem(item)
    setNewName(item)
    setNewQuantity('')
    setUpdateOpen(true)
  }
  const handleUpdateClose = () => setUpdateOpen(false)

  const handleAddItem = async () => {
    await addItem(itemName)
    setItemName('')
    handleClose()
  }

  const handleUpdateItem = async () => {
    await updateItem(currentItem, newName, newQuantity)
    setCurrentItem(null)
    setNewName('')
    setNewQuantity('')
    handleUpdateClose()
  }

  const filteredInventory = inventory.filter(({ name }) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      sx={{
        backgroundImage: 'url(/pantry_img.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction={'row'} spacing={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              onClick={handleAddItem}
              sx={buttonStyles}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      
      <Modal
        open={updateOpen}
        onClose={handleUpdateClose}
        aria-labelledby="update-modal-title"
        aria-describedby="update-modal-description"
      >
        <Box sx={style}>
          <Typography id="update-modal-title" variant="h6" component="h2">
            Update Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2}>
            <TextField
              id="outlined-new-name"
              label="New Name"
              variant="outlined"
              fullWidth
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <TextField
              id="outlined-new-quantity"
              label="New Quantity"
              variant="outlined"
              fullWidth
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
            />
            <Button
              onClick={handleUpdateItem}
              sx={buttonStyles}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>
      
      <Button sx={buttonStyles} onClick={handleOpen}>
        Add New Item
      </Button>
      
      <TextField
        id="search-input"
        label="Search Items"
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ 
          marginBottom: 2,
          backgroundColor: 'white',  // Set background color to white
          width: '800px'
        }}
      />

      <Box border={'1px solid #333'}>
        <Box
          width="800px"
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Pantry Items
          </Typography>
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow={'auto'}>
          {filteredInventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                Quantity: {quantity || 0}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button sx={buttonStyles} onClick={() => removeItem(name)}>
                  Remove
                </Button>
                <Button sx={buttonStyles} onClick={() => handleUpdateOpen(name)}>
                  Update
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
