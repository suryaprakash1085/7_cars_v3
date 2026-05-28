"use client";
// import React from "react";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import {
  Typography,
  Box,
  TextField,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Modal,
  List,
  ListItem,
  ListItemText,
  Paper,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from "@mui/material";
import AppAlert from "@/components/snackBar";
import AddIcon from "@mui/icons-material/Add";
import InfoIcon from "@mui/icons-material/Info";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const pages = [
  { id: "JobCard", name: "JobCard" },
  { id: "ServiceCenter", name: "ServiceCenter" },
  { id: "Sc_completed", name: "Sc_completed" },
  { id: "ServiceInspection", name: "ServiceInspection" },
  { id: "Invoice", name: "Invoice" },
  { id: "Finance", name: "Finance" },
  {id:"Attended-Interested",name:"Attended-Interested"},
  {id:"Attended-Not Interested",name:"Attended-Not Interested"},
  // {id:"Call Back Later",name:"Call Back Later"},
  {id:"Not Attended",name:"Not Attended"},
  {id:"purchase",name:"purchase"},
  {id:"Call Back Later-Interested",name:"Call Back Later-Interested"},
  {id:"Call Back Later-Not Interested",name:"Call Back Later-Not Interested"},

  
];

export default function WhatsappTemplate() {
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [snackbarData, setSnackbarData] = useState({});
  const [isManageTemplateOpen, setIsManageTemplateOpen] = useState(false);
  const [assignments, setAssignments] = useState({}); // To track assignments
  const [selectedTemplate, setSelectedTemplate] = useState(null); // For editing
  const [isEditing, setIsEditing] = useState(false); // Track if editing
  const [helpModal, setHelpModal] = useState(false);
  const [token, setToken] = useState(null);

  // Fetch templates from the API
  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
        headers: {
          Authorization: `Bearer ${Cookies.get('token')}`,
          "Content-Type": "application/json",
        },
      });
      const fetchedTemplates = response.data;

      // Populate assignments based on fetched templates
      const newAssignments = {};
      fetchedTemplates.map(template => {
        if (template.intiator) {
          newAssignments[template.intiator] = template.id; // Map intiator to template ID
        }
      });

      setTemplates(fetchedTemplates);
      setAssignments(newAssignments); // Set the assignments state
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);
    fetchTemplates();
  }, []);

  const handleAddTemplate = () => {
    setIsAddTemplateOpen(true);
  };

  const handleSave = async () => {
    const save = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
      template_name: templateName,
      template_message: templateMessage,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (save.status === 200) {
      let snackbarData = {
        openAlert: true,
        message: "Template Saved",
        severity: "success",
        duration: 2000,
      };
      setSnackbarData(snackbarData);
    } else {
      let snackbarData = {
        openAlert: true,
        message: "There's something went wrong, Please try again",
        severity: "error",
        duration: 2000,
      };
      setSnackbarData(snackbarData);
    }
    setIsAddTemplateOpen(false);
  };

  const handleTemplateChange = (pageId, templateId) => {
    setAssignments((prevAssignments) => ({
      ...prevAssignments,
      [pageId]: templateId, // Assign the selected template to the page
    }));
  };

  const handleSaveAssignments = async () => {
    const data = Object.entries(assignments).map(([templateId, pageId]) => ({
      templateId,
      intiator: pageId, // Update the intiator with the page ID
    }));

    try {
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/templates/intiator/`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      if (response.status === 200) {
        let snackbarData = {
          openAlert: true,
          message: "Assignments Saved",
          severity: "success",
          duration: 2000,
        };
        setSnackbarData(snackbarData);
      }
    } catch (error) {
      console.error("Error saving assignments:", error);
      let snackbarData = {
        openAlert: true,
        message: "There was an error saving assignments, please try again.",
        severity: "error",
        duration: 2000,
      };
      setSnackbarData(snackbarData);
    }

    setIsManageTemplateOpen(false);
  };

  const handleCancel = () => {
    setIsManageTemplateOpen(false);
  };

  const getAvailableTemplates = (pageId) => {
    const assignedTemplateIds = Object.values(assignments);
    return templates.filter(template => !assignedTemplateIds.includes(template.id) || assignments[pageId] === template.id);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleUpdateTemplate = async () => {
    if (selectedTemplate) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/templates/update/${selectedTemplate.id}`, selectedTemplate, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        });
        fetchTemplates(); // Refresh the template list
        setIsEditing(false);
        setSelectedTemplate(null);
      } catch (error) {
        console.error("Error updating template:", error);
      }
    }
  };
  const handleDeleteTemplate = async () => {
    if (selectedTemplate) {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/templates/${selectedTemplate.id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });
      fetchTemplates(); // Refresh the template list
      setIsEditing(false);
      setSelectedTemplate(null);
    }
  };
  const handleCopy = (text) => {
    console.log("Copying text:", text); // Debugging line
    navigator.clipboard.writeText(text).then(() => {
      console.log("Text copied successfully"); // Debugging line
      toast.success(`${text} copied to clipboard!`); // Show toast notification
    }).catch((error) => {
      toast.error("Failed to copy text");
      // console.error("Failed to copy text:", error);
    });
  };

  return (
    <div>
      <ToastContainer />
      <Typography variant="h4" sx={{ marginBottom: 2 }}>Whatsapp Templates</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <Button variant="contained" onClick={handleAddTemplate}><AddIcon />Add Template</Button>
        <Button variant="outlined" onClick={() => setHelpModal(true)}>Help</Button>
        <Button variant="outlined" onClick={() => setIsManageTemplateOpen(true)}><SettingsIcon />Manage Template</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Template Name</TableCell>
              <TableCell>Template Message</TableCell>
              <TableCell>Info</TableCell>
              <TableCell>Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  {isEditing && selectedTemplate?.id === template.id ? (
                    <TextField
                      value={selectedTemplate.template_name}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, template_name: e.target.value })}
                    />
                  ) : (
                    template.template_name
                  )}
                </TableCell>
                <TableCell>
                  {isEditing && selectedTemplate?.id === template.id ? (
                    <TextField
                      value={selectedTemplate.template_message}
                      onChange={(e) => setSelectedTemplate({ ...selectedTemplate, template_message: e.target.value })}
                      multiline
                      rows={10}
                      fullWidth
                    />
                  ) : (
                    template.template_message
                  )}
                </TableCell>
                
                <TableCell>
  <Tooltip title={`Created Date: ${new Date(template.created_at).toLocaleDateString()}\n Updated Date: ${new Date(template.updated_at).toLocaleDateString()}`}>
    <InfoIcon />
  </Tooltip>
</TableCell>

                <TableCell>
                  {isEditing && selectedTemplate?.id === template.id ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button variant="contained" onClick={handleUpdateTemplate}>Save</Button>
                      <Button variant="contained" onClick={handleDeleteTemplate}><DeleteIcon/></Button>
                    </Box>
                  ) : (
                    <Button variant="outlined" onClick={() => handleEditTemplate(template)}>Edit</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div>
        {snackbarData.openAlert && (
          <AppAlert alertData={snackbarData} />
        )}
      </div>
      {isAddTemplateOpen && (
        <div>
          <Modal open={isAddTemplateOpen} onClose={() => setIsAddTemplateOpen(false)}>
            <Box sx={{
              width: '90%',
              maxWidth: 600,
              height: 'auto',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: 2,
              borderRadius: 2,
              boxShadow: 24,
              '@media (max-width: 600px)': {
                width: '90%',
              },
              '@media (max-width: 400px)': {
                width: '95%',
              },
            }}>
              <Typography variant="h6" sx={{ marginBottom: 2 }}> Add Template</Typography>
              
              <TextField 
                fullWidth
                sx={{ marginBottom: 2 }} 
                label="Template Name" 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
              />
              <TextField 
                fullWidth
                sx={{ marginBottom: 2 }} 
                label="Template Message" 
                value={templateMessage} 
                onChange={(e) => setTemplateMessage(e.target.value)} 
                multiline
                rows={4}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="outlined" onClick={() => setIsAddTemplateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSave}
                >
                  Save
                </Button>
              </Box>
            </Box>
          </Modal>
        </div>
      )}
      {isManageTemplateOpen && (
        <div>
          <Modal open={isManageTemplateOpen} onClose={handleCancel}>
            <Box sx={{ 
              width: '90%', 
              maxWidth: 800, 
              padding: 2, 
              backgroundColor: 'white', 
              borderRadius: 2, 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              boxShadow: 24,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
              <Typography variant="h6" sx={{ marginBottom: 2 }}>Match Templates to Pages</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Paper sx={{ width: '45%', padding: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle1">Templates</Typography>
                  <List>
                    {templates.map((template) => (
                      <ListItem key={template.id} sx={{ marginBottom: 1, backgroundColor: '#fff', borderRadius: 1, boxShadow: 1 }}>
                        <ListItemText primary={template.template_name} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
                <Paper sx={{ width: '45%', padding: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="subtitle1">Pages</Typography>
                  <List>
                    {pages.map((page) => (
                      <ListItem key={page.id} sx={{ marginBottom: 1, backgroundColor: '#fff', borderRadius: 1, boxShadow: 1 }}>
                        <ListItemText primary={page.name} />
                        <Select
                          value={assignments[page.id] || ""}
                          onChange={(e) => handleTemplateChange(page.id, e.target.value)}
                          displayEmpty
                          sx={{ marginLeft: 2 }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {getAvailableTemplates(page.id).map((template) => (
                            <MenuItem key={template.id} value={template.id}>
                              {template.template_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
                <Button variant="outlined" onClick={handleCancel} sx={{ marginRight: 1 }}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={handleSaveAssignments}>
                  Save
                </Button>
              </Box>
            </Box>
          </Modal>
        </div>
      )}
      {helpModal && (
        <div>
         <Modal open={helpModal} onClose={() => setHelpModal(false)}>
      <Paper sx={{ padding: 3, maxWidth: 600, margin: 'auto', marginTop: '10%', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Help - Available Placeholders
        </Typography>
        
        <Typography variant="body1" paragraph>
          Below are the templates and their available placeholders. You can copy any placeholder by clicking the "Copy" button.
        </Typography>

        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {[
            {
              name: 'JobCard',
              placeholders: ['{{customer_name}}', '{{vehicle_id}}', '{{order_id}}'],
            },
            {
              name: 'ServiceCenter',
              placeholders: ['{{customer_name}}', '{{vehicle_id}}', '{{order_id}}', '{{mechanic_name}}'],
            },
            {
              name: 'sc-job-completed',
              placeholders: ['{{customer_name}}', '{{vehicle_id}}', '{{order_id}}'],
            },
            {
              name: 'inspec completed',
              placeholders: ['{{customer_name}}', '{{vehicle_id}}', '{{order_id}}'],
            },
            {
              name: 'Invoice',
              placeholders: ['{{customer_name}}', '{{vehicle_id}}', '{{order_id}}', '{{invoice_amount}}'],
            },
            {
              name: 'Finance',
              placeholders: ['{{customer_name}}', '{{order_id}}', '{{invoice_amount}}', '{{paid_amount}}'],
            },
            {
              name: 'Purchase',
              placeholders: ['{{product_name}}', '{{supplier_name}}', '{{qty}}', '{{supplier_number}}'],
            },
            {
              name: 'Telecaller',
              placeholders: ['{{user_name}}', '{{comment}}', '{{telecaller_name}}', '{{telecaller_number}}'],
            },
            
          ].map((template, index) => (
            <Box key={index} sx={{ marginBottom: 3 }}>
              <Typography variant="h6">{template.name}</Typography>
              <Grid container spacing={1}>
                {template.placeholders.map((placeholder, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <TextField
                      disabled
                      label={placeholder}
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Button 
                            onClick={() => handleCopy(placeholder)} 
                            sx={{ marginLeft: 1 }} 
                            variant="outlined"
                          >
                            Copy
                          </Button>
                        ),
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      </Paper>
    </Modal>

        </div>
      )}
    </div>
  )
}

