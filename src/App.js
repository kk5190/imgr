import React, { Component } from "react"
import { Layout } from "antd"
import Axios from "axios"
import { Card, Tag, Row, Image, AutoComplete, List, Spin, message, Space } from "antd"
import InfiniteScroll from "react-infinite-scroller"
import "./App.css"

const { Header, Content, Footer } = Layout

class App extends Component {
  constructor() {
    super()
    this.debounceTimeout = 0
    this.state = {
      page: 0,
      total: 1000,
      photos: [],
      searchPhotos: [],
      loading: false,
      hasMore: true,
      isSearching: false,
      recentSearches: []
    }
  }

  componentDidMount() {
    this.getRecentImages(this.state.page)
    this.getRecentSearch()
  }

  debounceSearch = value => {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }
    this.debounceTimeout = setTimeout(() => this.handleSearch(value), 300)
  }

  searchImages = value => {
    let recentSearches = JSON.parse(localStorage.getItem("recentSearch"))
    if (recentSearches) {
      recentSearches.push(value)
      localStorage.setItem("recentSearch", JSON.stringify(recentSearches))
    } else {
      localStorage.setItem("recentSearch", JSON.stringify([value]))
    }

    this.setState({ recentSearches: JSON.parse(localStorage.getItem("recentSearch")) })

    const url = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=9fc9e97c7d98324538408a765ed13f7d&text=${value}&sort=interestingness-desc&safe_search=3&content_type=1&per_page=12&page=${this.state.page}&format=json&nojsoncallback=1`
    this.setState({ loading: true })
    Axios.get(url).then(res => {
      if (!this.state.isSearching) {
        this.setState({ photos: res.data.photos.photo, loading: false, isSearching: true, page: 0, total: res.data.photos.total })
      } else {
        this.setState({ photos: [...this.state.photos, ...res.data.photos.photo], loading: false, isSearching: true, page: this.state.page + 1 })
      }
    })
  }

  getRecentImages = page => {
    const url = `https://www.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=9fc9e97c7d98324538408a765ed13f7d&per_page=12&page=${page}&format=json&nojsoncallback=1`
    this.setState({ loading: true })
    Axios.get(url).then(res => {
      if (this.state.isSearching) {
        this.setState({ photos: res.data.photos.photo, page: 0, total: res.data.photos.total, loading: false })
      } else {
        this.setState({ photos: [...this.state.photos, ...res.data.photos.photo], page: this.state.page + 1, total: res.data.photos.total, loading: false })
      }
    })
  }

  handleSearch = value => {
    if (value === "" || value === undefined) {
      this.setState({ searchPhotos: [], loading: false })
    } else {
      const url = `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=9fc9e97c7d98324538408a765ed13f7d&text=${value}&sort=interestingness-desc&safe_search=3&content_type=1&per_page=100&page=0&format=json&nojsoncallback=1`
      this.setState({ loading: true })
      Axios.get(url).then(res => {
        this.setState({ searchPhotos: [...res.data.photos.photo], loading: false })
      })
    }
  }

  handleInfiniteOnLoad = async () => {
    if (this.state.photos.length >= this.state.total) {
      message.warning("Hurray! You have reached the end.")
      this.setState({
        hasMore: false,
        loading: false
      })
      return
    }
    if (this.state.isSearching) {
      this.searchImages()
    } else {
      this.getRecentImages(this.state.page)
    }
  }

  getRecentSearch = () => {
    let recentSearches = JSON.parse(localStorage.getItem("recentSearch"))
    if (recentSearches) {
      this.setState({ recentSearches: JSON.parse(localStorage.getItem("recentSearch")) })
    }
  }

  render() {
    return (
      <Layout className="layout">
        <Header>
          <Row gutter={[16, 16]}>
            <AutoComplete
              style={{
                width: 500
              }}
              notFoundContent="No result found"
              placeholder="search"
              loading={this.state.loading}
              onChange={this.debounceSearch}
              onSelect={this.searchImages}
              allowClear
            >
              {this.state.searchPhotos.map(photo => (
                <AutoComplete.Option key={photo.id} value={photo.title}>
                  {photo.title}
                </AutoComplete.Option>
              ))}
            </AutoComplete>
          </Row>
        </Header>
        <Content style={{ padding: "0 50px" }}>
          <div className="site-layout-content">
            <Row>
              <Space>
                {this.state.recentSearches.length > 0 && <p>Your recent search:</p>}
                {this.state.recentSearches.map(search => (
                  <Tag closable>{search}</Tag>
                ))}
              </Space>
              <Space direction="vertical"></Space>
            </Row>

            <Row gutter={[0, 8]}>
              <div className="demo-infinite-container">
                <InfiniteScroll initialLoad={false} pageStart={0} loadMore={this.handleInfiniteOnLoad} hasMore={!this.state.loading && this.state.hasMore} useWindow={true}>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4 }}
                    dataSource={this.state.photos}
                    renderItem={photo => (
                      <List.Item key={photo.id}>
                        <Card style={{ width: 320 }}>
                          <Image width={280} height={280} src={`https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}.jpg`} />
                        </Card>
                      </List.Item>
                    )}
                  >
                    {this.state.loading && this.state.hasMore && (
                      <div className="demo-loading-container">
                        <Spin />
                      </div>
                    )}
                  </List>
                </InfiniteScroll>
              </div>
            </Row>
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>Imgr ©2021 Created by Krishna Singh</Footer>
      </Layout>
    )
  }
}

export default App
