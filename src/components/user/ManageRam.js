import React from 'react'
import {
  Modal,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button, Form, FormGroup, Input, Alert, Collapse
} from 'reactstrap'
import { withFormik } from 'formik'
import Spinner from 'react-spinkit'
import { checkAccountNameError } from '../../utils/eoshelper'

const ManageRamForm = props => {
  const { 
    values,
    touched,
    errors,
    handleChange,
    handleBlur,
    handleSubmit,
    showModalRam, handleToggleModalRam,
    isProcessing, resourceHandleErr
  } = props

  return (
    <Modal isOpen={showModalRam} toggle={handleToggleModalRam} >
      <ModalHeader toggle={handleToggleModalRam}>Buy/Sell RAM</ModalHeader>
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Input
              id='accountName'
              onBlur={handleBlur}
              value={values.accountName}
              onChange={handleChange}
              invalid={errors.accountName && touched.accountName}
              type="text"
              placeholder="must be 12 symbols long and include symbols a-z 1-5"
            />
            <Input
              id='ramAmount'
              onBlur={handleBlur}
              value={values.ramAmount}
              onChange={handleChange}
              invalid={errors.ramAmount && touched.ramAmount}
              type="text"
              placeholder="RAM amount (in bytes)"
            />
          </FormGroup>
          <Button 
            type="submit" color='secondary' className="btn-base btn-home"
            disabled={(touched.accountName && errors.accountName)}
          >
            {isProcessing ?
              <Spinner name="three-bounce" color="red"/>
            :
              <span>Submit</span>
            }
            
          </Button>
          <Collapse isOpen={resourceHandleErr}>
            <Alert color="danger">
              {resourceHandleErr}
            </Alert>
          </Collapse>
        </Form>
      </ModalBody>
      <ModalFooter />
    </Modal>
  )
}

const EnhancedManageRamForm = withFormik({
  mapPropsToValues: () => ({ accountName: '' }),
  validate: values => {
    return checkAccountNameError(values.accountName)
  },

  handleSubmit: async({ accountName }, { props }) => {
    await props.handleCreateNewAccount(accountName)
  },

  displayName: 'ManageRamForm' // helps with React DevTools
})(ManageRamForm)

export default EnhancedManageRamForm
