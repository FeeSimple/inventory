import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import Table from './Table'
import { UNIT, FSMGRCONTRACT } from '../../../utils/consts'
import { addUnits, delUnit } from '../../../actions/index'
import { ERR_DATA_LOADING_FAILED } from '../../../utils/error'
import { setLoading, setOpResult } from '../../../actions'
import Confirm from '../../layout/Confirm'

class UnitContainer extends Component {
  constructor (props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
    this.deleteOne = this.deleteOne.bind(this)
    this.deleteBulk = this.deleteBulk.bind(this)
    this.state = {
      checkedEntry: {},
      showConfirm: false,
      propertyId: 0,
      unitId: 0,
      unitName: '',
      deleteBulkDisabled: true
    }
  }

  async componentDidMount () {
    const { eosClient, accountData, addUnits } = this.props
    const { id } = this.props.match.params

    try {
      const { rows } = await eosClient.getTableRows(
        true,
        FSMGRCONTRACT,
        accountData.active,
        UNIT
      )
      console.log('Get table "unit" result:', rows)

      try {
        addUnits(id, rows)
      } catch (err) {
        console.log('addUnits error:', err)
      }
    } catch (err) {
      console.log('Get table "unit" failed - err:', err)
    }
  }

  onDelete = async () => {
    this.handleToggleConfirm(-1, -1);
    const { propertyId, unitId, unitName } = this.state
    if (propertyId !== -1 && unitId !== -1) {
      await this.deleteOne(propertyId, unitId, unitName)
    } else {
      await this.deleteBulk(propertyId)
    }
  }

  deleteOne = async (propertyId, unitId, unitName) => {
    const { setLoading, setOpResult } = this.props

    setLoading(true)

    let deleteOK = await this.doDelete(propertyId, unitId)

    if (!deleteOK) {
      setOpResult({
        show: true,
        title: 'Internal Service Error',
        text: `Failed to delete Unit "${unitName}"`,
        type: 'error'
      })
    } else {
      setOpResult({
        show: true,
        title: 'Success',
        text: `Unit "${unitName}" deleted successfully`,
        type: 'success',
      })
    }

    setLoading(false)
  }

  doDelete = async (propertyId, unitId) => {
    const { contracts, accountData } = this.props
    const fsmgrcontract = contracts[FSMGRCONTRACT]
    const options = {
      authorization: `${accountData.active}@active`,
      broadcast: true,
      sign: true
    }

    let deleteOK = true

    try {
      await fsmgrcontract.delunit(accountData.active, unitId, options)
      console.log('fsmgrcontract.delunit - unitId:', unitId)
    } catch (err) {
      console.log('fsmgrcontract.delunit - error:', err)
      deleteOK = false
    }

    try {
      delUnit(propertyId, unitId)
    } catch (err) {
      console.log('delUnit error:', err)
      deleteOK = false
    }

    return deleteOK
  }

  isCheckedEntry = () => {
    let checkedEntry = this.state.checkedEntry
    let ids = Object.keys(checkedEntry)
    for (let i = 0; i < ids.length; i++) {
      let id = ids[i]
      if (checkedEntry[id] == true) {
        return true
      }
    }
    return false
  }

  handleInputChange (event) {
    const target = event.target
    const value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name

    let checked = this.state.checkedEntry
    checked[name] = value
    this.setState({
      checkedEntry: checked
    })

    this.setState({
      deleteBulkDisabled: !this.isCheckedEntry()
    })
  }

  getUnitName = (unitId) => {
    const { properties } = this.props
    const { id } = this.props.match.params
    const property = properties[id]
    if (!property) return ''
    let unit = property.units[unitId]
    if (!unit) return ''
    console.log(`unit id: ${unitId}, unit name: ${unit.name}`);
    return unit.name
  }

  deleteBulk = async propertyId => {
    let checkedEntry = this.state.checkedEntry
    let ids = Object.keys(checkedEntry)
    console.log(`Unit deleteBulk - propertyId: ${propertyId}`)
    console.log('Unit deleteBulk - ids: ', ids)

    const { setLoading, setOpResult } = this.props

    setLoading(true)

    let failedUnits = ''

    for (let i = 0; i < ids.length; i++) {
      let id = ids[i]
      if (checkedEntry[id] === true) {
        console.log(`Unit deleteBulk - id: ${id}`)
        let deleteOK = await this.doDelete(propertyId, id)
        if (!deleteOK) {
          failedUnits += `"${this.getUnitName(id)}", `
        }
      }
    }

    if (failedUnits !== '') {
      setOpResult({
        show: true,
        title: 'Internal Service Error',
        text: `Failed to delete the following units: ${failedUnits}` ,
        type: 'error'
      })
    } else {
      setOpResult({
        show: true,
        title: 'Success',
        text: `Selected units are deleted successfully`,
        type: 'success',
      })
    }

    setLoading(false)
  }

  handleToggleConfirm = (propertyId, unitId, unitName) => {
    const { showConfirm } = this.state
    this.setState({ showConfirm: !showConfirm })

    if (propertyId !== -1 || unitId !== -1) {
      this.setState({
        propertyId: propertyId,
        unitId: unitId,
        unitName: unitName
      })
    }
  }

  render () {
    const { properties } = this.props
    const { id } = this.props.match.params
    const property = properties[id]
    if (!property) {
      return <h1 className='error-message'>{ERR_DATA_LOADING_FAILED}</h1>
    } else {
      return (
        <div>
          <Table
            propertyId={property.id}
            property={property}
            onChange={this.handleInputChange}
            handleToggle={this.handleToggleConfirm}
            deleteBulkDisabled={this.state.deleteBulkDisabled}
          />
          <Confirm
            isOpen={this.state.showConfirm}
            handleToggle={this.handleToggleConfirm}
            onDelete={this.onDelete}
            text='this unit?'
          />
        </div>
      )
    }
  }
}

function mapStateToProps ({
  properties,
  eosClient,
  scatter,
  contracts,
  accountData
}) {
  return { properties, eosClient, scatter, contracts, accountData }
}

export default withRouter(
  connect(mapStateToProps, { addUnits, setLoading, delUnit, setOpResult })(UnitContainer)
)
